use std::borrow::Borrow;
use std::collections::BTreeSet;
use std::future::Future;
use std::ops::Deref;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::Request;
use axum::response::Response;
use base64::Engine;
use basic_cookies::Cookie;
use chrono::Utc;
use color_eyre::eyre::eyre;
use digest::Digest;
use helpers::const_true;
use http::header::{COOKIE, USER_AGENT};
use http::HeaderValue;
use imbl_value::{json, InternedString};
use rand::random;
use rpc_toolkit::yajrc::INTERNAL_ERROR;
use rpc_toolkit::{Middleware, RpcRequest, RpcResponse};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::sync::Mutex;

use crate::auth::{check_password, write_shadow, Sessions};
use crate::context::RpcContext;
use crate::db::model::Database;
use crate::middleware::signature::{SignatureAuth, SignatureAuthContext};
use crate::prelude::*;
use crate::rpc_continuations::OpenAuthedContinuations;
use crate::sign::AnyVerifyingKey;
use crate::util::io::{create_file_mod, read_file_to_string};
use crate::util::iter::TransposeResultIterExt;
use crate::util::serde::BASE64;
use crate::util::sync::SyncMutex;
use crate::util::Invoke;

pub trait AuthContext: SignatureAuthContext {
    const LOCAL_AUTH_COOKIE_PATH: &str;
    const LOCAL_AUTH_COOKIE_OWNERSHIP: &str;
    fn init_auth_cookie() -> impl Future<Output = Result<(), Error>> + Send {
        async {
            let mut file = create_file_mod(Self::LOCAL_AUTH_COOKIE_PATH, 0o046).await?;
            file.write_all(BASE64.encode(random::<[u8; 32]>()).as_bytes())
                .await?;
            file.sync_all().await?;
            drop(file);
            Command::new("chown")
                .arg(Self::LOCAL_AUTH_COOKIE_OWNERSHIP)
                .arg(Self::LOCAL_AUTH_COOKIE_PATH)
                .invoke(crate::ErrorKind::Filesystem)
                .await?;
            Ok(())
        }
    }
    fn ephemeral_sessions(&self) -> &SyncMutex<Sessions>;
    fn open_authed_continuations(&self) -> &OpenAuthedContinuations<Option<InternedString>>;
    fn access_sessions(db: &mut Model<Self::Database>) -> &mut Model<Sessions>;
    fn check_password(db: &Model<Self::Database>, password: &str) -> Result<(), Error>;
    #[allow(unused_variables)]
    fn post_login_hook(&self, password: &str) -> impl Future<Output = Result<(), Error>> + Send {
        async { Ok(()) }
    }
}

impl SignatureAuthContext for RpcContext {
    type Database = Database;
    type AdditionalMetadata = ();
    type CheckPubkeyRes = ();
    fn db(&self) -> &TypedPatchDb<Self::Database> {
        &self.db
    }
    async fn sig_context(
        &self,
    ) -> impl IntoIterator<Item = Result<impl AsRef<str> + Send, Error>> + Send {
        let peek = self.db.peek().await;
        self.account
            .read()
            .await
            .hostnames()
            .into_iter()
            .map(Ok)
            .chain(
                peek.as_public()
                    .as_server_info()
                    .as_network()
                    .as_host()
                    .as_domains()
                    .keys()
                    .map(|k| k.into_iter())
                    .transpose(),
            )
            .collect::<Vec<_>>()
    }
    fn check_pubkey(
        db: &Model<Self::Database>,
        pubkey: Option<&AnyVerifyingKey>,
        _: Self::AdditionalMetadata,
    ) -> Result<Self::CheckPubkeyRes, Error> {
        if let Some(pubkey) = pubkey {
            if db.as_private().as_auth_pubkeys().de()?.contains(pubkey) {
                return Ok(());
            }
        }

        Err(Error::new(
            eyre!("Developer Key is not authorized"),
            ErrorKind::IncorrectPassword,
        ))
    }
    async fn post_auth_hook(&self, _: Self::CheckPubkeyRes, _: &RpcRequest) -> Result<(), Error> {
        Ok(())
    }
}
impl AuthContext for RpcContext {
    const LOCAL_AUTH_COOKIE_PATH: &str = "/run/startos/rpc.authcookie";
    const LOCAL_AUTH_COOKIE_OWNERSHIP: &str = "root:startos";
    fn ephemeral_sessions(&self) -> &SyncMutex<Sessions> {
        &self.ephemeral_sessions
    }
    fn open_authed_continuations(&self) -> &OpenAuthedContinuations<Option<InternedString>> {
        &self.open_authed_continuations
    }
    fn access_sessions(db: &mut Model<Self::Database>) -> &mut Model<Sessions> {
        db.as_private_mut().as_sessions_mut()
    }
    fn check_password(db: &Model<Self::Database>, password: &str) -> Result<(), Error> {
        check_password(&db.as_private().as_password().de()?, password)
    }
    async fn post_login_hook(&self, password: &str) -> Result<(), Error> {
        if tokio::fs::metadata("/media/startos/config/overlay/etc/shadow")
            .await
            .is_err()
        {
            write_shadow(&password).await?;
        }
        Ok(())
    }
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRes {
    pub session: InternedString,
}

pub trait AsLogoutSessionId {
    fn as_logout_session_id(self) -> InternedString;
}

/// Will need to know when we have logged out from a route
#[derive(Serialize, Deserialize)]
pub struct HasLoggedOutSessions(());

impl HasLoggedOutSessions {
    pub async fn new<C: AuthContext>(
        sessions: impl IntoIterator<Item = impl AsLogoutSessionId>,
        ctx: &C,
    ) -> Result<Self, Error> {
        let to_log_out: BTreeSet<_> = sessions
            .into_iter()
            .map(|s| s.as_logout_session_id())
            .collect();
        for sid in &to_log_out {
            ctx.open_authed_continuations().kill(&Some(sid.clone()))
        }
        ctx.ephemeral_sessions().mutate(|s| {
            for sid in &to_log_out {
                s.0.remove(sid);
            }
        });
        ctx.db()
            .mutate(|db| {
                let sessions = C::access_sessions(db);
                for sid in &to_log_out {
                    sessions.remove(sid)?;
                }

                Ok(())
            })
            .await
            .result?;
        Ok(HasLoggedOutSessions(()))
    }
}

/// Used when we need to know that we have logged in with a valid user
#[derive(Clone)]
pub struct HasValidSession(SessionType);

#[derive(Clone)]
enum SessionType {
    Local,
    Session(HashSessionToken),
}

impl HasValidSession {
    pub async fn from_header<C: AuthContext>(
        header: Option<&HeaderValue>,
        ctx: &C,
    ) -> Result<Self, Error> {
        if let Some(cookie_header) = header {
            let cookies = Cookie::parse(
                cookie_header
                    .to_str()
                    .with_kind(crate::ErrorKind::Authorization)?,
            )
            .with_kind(crate::ErrorKind::Authorization)?;
            if let Some(cookie) = cookies.iter().find(|c| c.get_name() == "local") {
                if let Ok(s) = Self::from_local::<C>(cookie).await {
                    return Ok(s);
                }
            }
            if let Some(cookie) = cookies.iter().find(|c| c.get_name() == "session") {
                if let Ok(s) = Self::from_session(HashSessionToken::from_cookie(cookie), ctx).await
                {
                    return Ok(s);
                }
            }
        }
        Err(Error::new(
            eyre!("UNAUTHORIZED"),
            crate::ErrorKind::Authorization,
        ))
    }

    pub async fn from_session<C: AuthContext>(
        session_token: HashSessionToken,
        ctx: &C,
    ) -> Result<Self, Error> {
        let session_hash = session_token.hashed();
        if !ctx.ephemeral_sessions().mutate(|s| {
            if let Some(session) = s.0.get_mut(session_hash) {
                session.last_active = Utc::now();
                true
            } else {
                false
            }
        }) {
            ctx.db()
                .mutate(|db| {
                    C::access_sessions(db)
                        .as_idx_mut(session_hash)
                        .ok_or_else(|| {
                            Error::new(eyre!("UNAUTHORIZED"), crate::ErrorKind::Authorization)
                        })?
                        .mutate(|s| {
                            s.last_active = Utc::now();
                            Ok(())
                        })
                })
                .await
                .result?;
        }
        Ok(Self(SessionType::Session(session_token)))
    }

    pub async fn from_local<C: AuthContext>(local: &Cookie<'_>) -> Result<Self, Error> {
        let token = read_file_to_string(C::LOCAL_AUTH_COOKIE_PATH).await?;
        if local.get_value() == &*token {
            Ok(Self(SessionType::Local))
        } else {
            Err(Error::new(
                eyre!("UNAUTHORIZED"),
                crate::ErrorKind::Authorization,
            ))
        }
    }
}

/// When we have a need to create a new session,
/// Or when we are using internal valid authenticated service.
#[derive(Debug, Clone)]
pub struct HashSessionToken {
    hashed: InternedString,
    token: InternedString,
}
impl HashSessionToken {
    pub fn new() -> Self {
        Self::from_token(InternedString::intern(
            base32::encode(
                base32::Alphabet::Rfc4648 { padding: false },
                &rand::random::<[u8; 16]>(),
            )
            .to_lowercase(),
        ))
    }

    pub fn from_token(token: InternedString) -> Self {
        let hashed = Self::hash(&*token);
        Self { hashed, token }
    }

    pub fn from_cookie(cookie: &Cookie) -> Self {
        Self::from_token(InternedString::intern(cookie.get_value()))
    }

    pub fn from_header(header: Option<&HeaderValue>) -> Result<Self, Error> {
        if let Some(cookie_header) = header {
            let cookies = Cookie::parse(
                cookie_header
                    .to_str()
                    .with_kind(crate::ErrorKind::Authorization)?,
            )
            .with_kind(crate::ErrorKind::Authorization)?;
            if let Some(session) = cookies.iter().find(|c| c.get_name() == "session") {
                return Ok(Self::from_cookie(session));
            }
        }
        Err(Error::new(
            eyre!("UNAUTHORIZED"),
            crate::ErrorKind::Authorization,
        ))
    }

    pub fn to_login_res(&self) -> LoginRes {
        LoginRes {
            session: self.token.clone(),
        }
    }

    pub fn hashed(&self) -> &InternedString {
        &self.hashed
    }

    fn hash(token: &str) -> InternedString {
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        InternedString::intern(
            base32::encode(
                base32::Alphabet::Rfc4648 { padding: false },
                hasher.finalize().as_slice(),
            )
            .to_lowercase(),
        )
    }
}
impl AsLogoutSessionId for HashSessionToken {
    fn as_logout_session_id(self) -> InternedString {
        self.hashed
    }
}
impl PartialEq for HashSessionToken {
    fn eq(&self, other: &Self) -> bool {
        self.hashed == other.hashed
    }
}
impl Eq for HashSessionToken {}
impl PartialOrd for HashSessionToken {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.hashed.partial_cmp(&other.hashed)
    }
}
impl Ord for HashSessionToken {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.hashed.cmp(&other.hashed)
    }
}
impl Borrow<str> for HashSessionToken {
    fn borrow(&self) -> &str {
        &*self.hashed
    }
}

#[derive(Deserialize)]
pub struct Metadata {
    #[serde(default = "const_true")]
    authenticated: bool,
    #[serde(default)]
    login: bool,
    #[serde(default)]
    get_session: bool,
    #[serde(default)]
    get_signer: bool,
}

#[derive(Clone)]
pub struct Auth {
    rate_limiter: Arc<Mutex<(usize, Instant)>>,
    cookie: Option<HeaderValue>,
    is_login: bool,
    set_cookie: Option<HeaderValue>,
    user_agent: Option<HeaderValue>,
    signature_auth: SignatureAuth,
}
impl Auth {
    pub fn new() -> Self {
        Self {
            rate_limiter: Arc::new(Mutex::new((0, Instant::now()))),
            cookie: None,
            is_login: false,
            set_cookie: None,
            user_agent: None,
            signature_auth: SignatureAuth::new(),
        }
    }
}
impl<C: AuthContext> Middleware<C> for Auth {
    type Metadata = Metadata;
    async fn process_http_request(
        &mut self,
        context: &C,
        request: &mut Request,
    ) -> Result<(), Response> {
        self.cookie = request.headers_mut().remove(COOKIE);
        self.user_agent = request.headers_mut().remove(USER_AGENT);
        self.signature_auth
            .process_http_request(context, request)
            .await?;
        Ok(())
    }
    async fn process_rpc_request(
        &mut self,
        context: &C,
        metadata: Self::Metadata,
        request: &mut RpcRequest,
    ) -> Result<(), RpcResponse> {
        async {
            if metadata.login {
                self.is_login = true;
                let guard = self.rate_limiter.lock().await;
                if guard.1.elapsed() < Duration::from_secs(20) && guard.0 >= 3 {
                    return Err(Error::new(
                        eyre!("Please limit login attempts to 3 per 20 seconds."),
                        crate::ErrorKind::RateLimited,
                    ));
                }
                if let Some(user_agent) = self.user_agent.as_ref().and_then(|h| h.to_str().ok()) {
                    request.params["__auth_userAgent"] =
                        Value::String(Arc::new(user_agent.to_owned()))
                    // TODO: will this panic?
                }
            } else if metadata.authenticated {
                if self
                    .signature_auth
                    .process_rpc_request(
                        context,
                        from_value(json!({
                            "get_signer": metadata.get_signer
                        }))?,
                        request,
                    )
                    .await
                    .is_err()
                {
                    match HasValidSession::from_header(self.cookie.as_ref(), context).await? {
                        HasValidSession(SessionType::Session(s)) if metadata.get_session => {
                            request.params["__auth_session"] =
                                Value::String(Arc::new(s.hashed().deref().to_owned()));
                        }
                        _ => (),
                    }
                }
            }
            Ok(())
        }
        .await
        .map_err(|e| RpcResponse::from_result(Err(e)))
    }
    async fn process_rpc_response(&mut self, _: &C, response: &mut RpcResponse) {
        if self.is_login {
            let mut guard = self.rate_limiter.lock().await;
            if guard.1.elapsed() < Duration::from_secs(20) {
                if response.result.is_err() {
                    guard.0 += 1;
                }
            } else {
                guard.0 = 0;
            }
            guard.1 = Instant::now();
            if response.result.is_ok() {
                let res = std::mem::replace(&mut response.result, Err(INTERNAL_ERROR));
                response.result = async {
                    let res = res?;
                    let login_res = from_value::<LoginRes>(res.clone())?;
                    self.set_cookie = Some(
                        HeaderValue::from_str(&format!(
                        "session={}; Path=/; SameSite=Strict; Expires=Fri, 31 Dec 9999 23:59:59 GMT;",
                        login_res.session
                    ))
                        .with_kind(crate::ErrorKind::Network)?,
                    );

                    Ok(res)
                }
                .await;
            }
        }
    }
    async fn process_http_response(&mut self, _: &C, response: &mut Response) {
        if let Some(set_cookie) = self.set_cookie.take() {
            response.headers_mut().insert("set-cookie", set_cookie);
        }
    }
}

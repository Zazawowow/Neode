use std::borrow::Cow;
use std::collections::{BTreeMap, BTreeSet};
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::{Arc, Weak};

use arti_client::config::onion_service::OnionServiceConfigBuilder;
use arti_client::{TorClient, TorClientConfig};
use base64::Engine;
use clap::Parser;
use color_eyre::eyre::eyre;
use futures::FutureExt;
use helpers::NonDetachingJoinHandle;
use imbl_value::InternedString;
use itertools::Itertools;
use lazy_static::lazy_static;
use regex::Regex;
use rpc_toolkit::{from_fn_async, Context, Empty, HandlerExt, ParentHandler};
use safelog::DisplayRedacted;
use serde::{Deserialize, Serialize};
use tor_hscrypto::pk::{HsId, HsIdKeypair};
use tor_hsservice::status::State as ArtiOnionServiceState;
use tor_hsservice::{HsNickname, RunningOnionService};
use tor_keymgr::config::ArtiKeystoreKind;
use tor_rtcompat::tokio::TokioRustlsRuntime;
use ts_rs::TS;

use crate::context::{CliContext, RpcContext};
use crate::prelude::*;
use crate::util::serde::{
    deserialize_from_str, display_serializable, serialize_display, Base64, HandlerExtSerde,
    WithIoFormat, BASE64,
};
use crate::util::sync::{SyncMutex, SyncRwLock};

const STARTING_HEALTH_TIMEOUT: u64 = 120; // 2min

#[derive(Debug, Clone, Copy)]
pub struct OnionAddress(pub HsId);
impl std::fmt::Display for OnionAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt_unredacted(f)
    }
}
impl FromStr for OnionAddress {
    type Err = Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(
            if s.ends_with(".onion") {
                Cow::Borrowed(s)
            } else {
                Cow::Owned(format!("{s}.onion"))
            }
            .parse::<HsId>()
            .with_kind(ErrorKind::Tor)?,
        ))
    }
}
impl Serialize for OnionAddress {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serialize_display(self, serializer)
    }
}
impl<'de> Deserialize<'de> for OnionAddress {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserialize_from_str(deserializer)
    }
}
impl PartialEq for OnionAddress {
    fn eq(&self, other: &Self) -> bool {
        self.0.as_ref() == other.0.as_ref()
    }
}
impl Eq for OnionAddress {}
impl PartialOrd for OnionAddress {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.0.as_ref().partial_cmp(other.0.as_ref())
    }
}
impl Ord for OnionAddress {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.0.as_ref().cmp(other.0.as_ref())
    }
}

pub struct TorSecretKey(pub HsIdKeypair);
impl TorSecretKey {
    pub fn onion_address(&self) -> OnionAddress {
        OnionAddress(HsId::from(self.0.as_ref().public().to_bytes()))
    }
    pub fn from_bytes(bytes: [u8; 64]) -> Result<Self, Error> {
        Ok(Self(
            tor_llcrypto::pk::ed25519::ExpandedKeypair::from_secret_key_bytes(bytes)
                .ok_or_else(|| {
                    Error::new(eyre!("invalid ed25519 expanded secret key"), ErrorKind::Tor)
                })?
                .into(),
        ))
    }
    pub fn generate() -> Self {
        Self(
            tor_llcrypto::pk::ed25519::ExpandedKeypair::from(
                &tor_llcrypto::pk::ed25519::Keypair::generate(&mut rand::rng()),
            )
            .into(),
        )
    }
}
impl Clone for TorSecretKey {
    fn clone(&self) -> Self {
        Self(HsIdKeypair::from(
            tor_llcrypto::pk::ed25519::ExpandedKeypair::from_secret_key_bytes(
                self.0.as_ref().to_secret_key_bytes(),
            )
            .unwrap(),
        ))
    }
}
impl std::fmt::Display for TorSecretKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            BASE64.encode(self.0.as_ref().to_secret_key_bytes())
        )
    }
}
impl FromStr for TorSecretKey {
    type Err = Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_bytes(Base64::<[u8; 64]>::from_str(s)?.0)
    }
}
impl Serialize for TorSecretKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serialize_display(self, serializer)
    }
}
impl<'de> Deserialize<'de> for TorSecretKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserialize_from_str(deserializer)
    }
}

#[derive(Default, Deserialize, Serialize)]
pub struct OnionStore(BTreeMap<OnionAddress, TorSecretKey>);
impl Map for OnionStore {
    type Key = OnionAddress;
    type Value = TorSecretKey;
    fn key_str(key: &Self::Key) -> Result<impl AsRef<str>, Error> {
        Self::key_string(key)
    }
    fn key_string(key: &Self::Key) -> Result<imbl_value::InternedString, Error> {
        Ok(InternedString::from_display(key))
    }
}
impl OnionStore {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn insert(&mut self, key: TorSecretKey) {
        self.0.insert(key.onion_address(), key);
    }
}
impl Model<OnionStore> {
    pub fn new_key(&mut self) -> Result<TorSecretKey, Error> {
        let key = TorSecretKey::generate();
        self.insert(&key.onion_address(), &key)?;
        Ok(key)
    }
    pub fn insert_key(&mut self, key: &TorSecretKey) -> Result<(), Error> {
        self.insert(&key.onion_address(), &key)
    }
    pub fn get_key(&self, address: &OnionAddress) -> Result<TorSecretKey, Error> {
        self.as_idx(address)
            .or_not_found(lazy_format!("private key for {address}"))?
            .de()
    }
}
impl std::fmt::Debug for OnionStore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        struct OnionStoreMap<'a>(&'a BTreeMap<OnionAddress, TorSecretKey>);
        impl<'a> std::fmt::Debug for OnionStoreMap<'a> {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                #[derive(Debug)]
                struct KeyFor(OnionAddress);
                let mut map = f.debug_map();
                for (k, v) in self.0 {
                    map.key(k);
                    map.value(&KeyFor(v.onion_address()));
                }
                map.finish()
            }
        }
        f.debug_tuple("OnionStore")
            .field(&OnionStoreMap(&self.0))
            .finish()
    }
}

enum ErrorLogSeverity {
    Fatal { wipe_state: bool },
    Unknown { wipe_state: bool },
}

lazy_static! {
    static ref LOG_REGEXES: Vec<(Regex, ErrorLogSeverity)> = vec![(
        Regex::new("This could indicate a route manipulation attack, network overload, bad local network connectivity, or a bug\\.").unwrap(),
        ErrorLogSeverity::Unknown { wipe_state: true }
    ),(
        Regex::new("died due to an invalid selected path").unwrap(),
        ErrorLogSeverity::Fatal { wipe_state: false }
    ),(
        Regex::new("Tor has not observed any network activity for the past").unwrap(),
        ErrorLogSeverity::Unknown { wipe_state: false }
    )];
    static ref PROGRESS_REGEX: Regex = Regex::new("PROGRESS=([0-9]+)").unwrap();
}

pub fn tor_api<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "list-services",
            from_fn_async(list_services)
                .with_display_serializable()
                .with_custom_display_fn(|handle, result| display_services(handle.params, result))
                .with_about("Display Tor V3 Onion Addresses")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "reset",
            from_fn_async(reset)
                .no_display()
                .with_about("Reset Tor daemon")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "key",
            key::<C>().with_about("Manage the onion service key store"),
        )
}

pub fn key<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "generate",
            from_fn_async(generate_key)
                .with_about("Generate an onion service key and add it to the key store")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "add",
            from_fn_async(add_key)
                .with_about("Add an onion service key to the key store")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "list",
            from_fn_async(list_keys)
                .with_custom_display_fn(|_, res| {
                    for addr in res {
                        println!("{addr}");
                    }
                    Ok(())
                })
                .with_about("List onion services with keys in the key store")
                .with_call_remote::<CliContext>(),
        )
}

pub async fn generate_key(ctx: RpcContext) -> Result<OnionAddress, Error> {
    ctx.db
        .mutate(|db| {
            Ok(db
                .as_private_mut()
                .as_key_store_mut()
                .as_onion_mut()
                .new_key()?
                .onion_address())
        })
        .await
        .result
}

#[derive(Deserialize, Serialize, Parser)]
pub struct AddKeyParams {
    pub key: Base64<[u8; 64]>,
}

pub async fn add_key(
    ctx: RpcContext,
    AddKeyParams { key }: AddKeyParams,
) -> Result<OnionAddress, Error> {
    let key = TorSecretKey::from_bytes(key.0)?;
    ctx.db
        .mutate(|db| {
            db.as_private_mut()
                .as_key_store_mut()
                .as_onion_mut()
                .insert_key(&key)
        })
        .await
        .result?;
    Ok(key.onion_address())
}

pub async fn list_keys(ctx: RpcContext) -> Result<BTreeSet<OnionAddress>, Error> {
    ctx.db
        .peek()
        .await
        .into_private()
        .into_key_store()
        .into_onion()
        .keys()
}

#[derive(Deserialize, Serialize, Parser, TS)]
#[serde(rename_all = "camelCase")]
#[command(rename_all = "kebab-case")]
pub struct ResetParams {
    #[arg(name = "wipe-state", short = 'w', long = "wipe-state")]
    wipe_state: bool,
}

pub async fn reset(ctx: RpcContext, ResetParams { wipe_state }: ResetParams) -> Result<(), Error> {
    ctx.net_controller.tor.reset(wipe_state).await
}

pub fn display_services(
    params: WithIoFormat<Empty>,
    services: BTreeMap<OnionAddress, OnionServiceState>,
) -> Result<(), Error> {
    use prettytable::*;

    if let Some(format) = params.format {
        return display_serializable(format, services);
    }

    let mut table = Table::new();
    for (service, status) in services {
        let row = row![&service.to_string(), &format!("{status:?}")];
        table.add_row(row);
    }
    table.print_tty(false)?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum OnionServiceState {
    Shutdown,
    Bootstrapping,
    DegradedReachable,
    DegradedUnreachable,
    Running,
    Recovering,
    Broken,
}

pub async fn list_services(
    ctx: RpcContext,
    _: Empty,
) -> Result<BTreeMap<OnionAddress, OnionServiceState>, Error> {
    ctx.net_controller.tor.list_services().await
}

pub struct TorController {
    client: TorClient<TokioRustlsRuntime>,
    services: SyncMutex<BTreeMap<OnionAddress, OnionService>>,
}
impl TorController {
    pub async fn new() -> Result<Self, Error> {
        let mut config = TorClientConfig::builder();
        config
            .storage()
            .keystore()
            .primary()
            .kind(ArtiKeystoreKind::Ephemeral.into());
        Ok(Self {
            client: TorClient::with_runtime(TokioRustlsRuntime::current()?)
                .config(config.build().with_kind(ErrorKind::Tor)?)
                .create_unbootstrapped_async()
                .await?,
            services: SyncMutex::new(BTreeMap::new()),
        })
    }

    pub fn service(&self, key: TorSecretKey) -> Result<OnionService, Error> {
        self.services.mutate(|s| {
            use std::collections::btree_map::Entry;
            let addr = key.onion_address();
            match s.entry(addr) {
                Entry::Occupied(e) => Ok(e.get().clone()),
                Entry::Vacant(e) => Ok(e.insert(OnionService::launch(&self.client, key)?).clone()),
            }
        })
    }

    pub async fn gc(&self, addr: Option<OnionAddress>) -> Result<(), Error> {
        if let Some(addr) = addr {
            if let Some(s) = self.services.mutate(|s| {
                let rm = if let Some(s) = s.get(&addr) {
                    !s.gc()
                } else {
                    false
                };
                if rm {
                    s.remove(&addr)
                } else {
                    None
                }
            }) {
                s.shutdown().await
            } else {
                Ok(())
            }
        } else {
            for s in self.services.mutate(|s| {
                let mut rm = Vec::new();
                s.retain(|_, s| {
                    if s.gc() {
                        true
                    } else {
                        rm.push(s.clone());
                        false
                    }
                });
                rm
            }) {
                s.shutdown().await?;
            }
            Ok(())
        }
    }

    pub async fn reset(&self, wipe_state: bool) -> Result<(), Error> {
        todo!()
    }

    pub async fn list_services(&self) -> Result<BTreeMap<OnionAddress, OnionServiceState>, Error> {
        todo!()
    }
}

#[derive(Clone)]
pub struct OnionService(Arc<OnionServiceData>);
struct OnionServiceData {
    service: Arc<RunningOnionService>,
    bindings: Arc<SyncRwLock<BTreeMap<u16, BTreeMap<SocketAddr, Weak<()>>>>>,
    _thread: NonDetachingJoinHandle<()>,
}
impl OnionService {
    fn launch(client: &TorClient<TokioRustlsRuntime>, key: TorSecretKey) -> Result<Self, Error> {
        let (service, stream) = client.launch_onion_service_with_hsid(
            OnionServiceConfigBuilder::default()
                .nickname(
                    key.onion_address()
                        .to_string()
                        .trim_end_matches(".onion")
                        .parse::<HsNickname>()
                        .with_kind(ErrorKind::Tor)?,
                )
                .build()
                .with_kind(ErrorKind::Tor)?,
            key.0,
        )?;
        let bindings = Arc::new(SyncRwLock::new(BTreeMap::new()));
        Ok(Self(Arc::new(OnionServiceData {
            service: service.clone(),
            bindings: bindings.clone(),
            _thread: tokio::spawn(async move {
                todo!();
            })
            .into(),
        })))
    }

    pub fn proxy_all<Rcs: FromIterator<Arc<()>>>(
        &self,
        bindings: impl IntoIterator<Item = (u16, SocketAddr)>,
    ) -> Rcs {
        todo!()
    }

    pub fn gc(&self) -> bool {
        todo!()
    }

    pub async fn shutdown(self) -> Result<(), Error> {
        todo!()
    }
}

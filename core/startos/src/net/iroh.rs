use std::collections::{BTreeMap, BTreeSet};
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::{Arc, Weak};

use clap::Parser;
use color_eyre::eyre::eyre;
use futures::{FutureExt, StreamExt};
use helpers::NonDetachingJoinHandle;
use imbl_value::InternedString;
use iroh::{Endpoint, NodeId, SecretKey};
use itertools::Itertools;
use rpc_toolkit::{from_fn_async, Context, Empty, HandlerExt, ParentHandler};
use serde::{Deserialize, Serialize};
use tokio::net::TcpStream;

use crate::context::{CliContext, RpcContext};
use crate::prelude::*;
use crate::util::actor::background::BackgroundJobQueue;
use crate::util::io::ReadWriter;
use crate::util::serde::{
    deserialize_from_str, display_serializable, serialize_display, HandlerExtSerde, Pem,
    PemEncoding, WithIoFormat,
};
use crate::util::sync::{SyncMutex, SyncRwLock, Watch};

const HRP: bech32::Hrp = bech32::Hrp::parse_unchecked("iroh");

#[derive(Debug, Clone, Copy)]
pub struct IrohAddress(pub NodeId);
impl std::fmt::Display for IrohAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        bech32::encode_lower_to_fmt::<bech32::Bech32m, _>(f, HRP, self.0.as_bytes())
            .map_err(|_| std::fmt::Error)?;
        write!(f, ".p2p.start9.to")
    }
}
impl FromStr for IrohAddress {
    type Err = Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if let Some(b32) = s.strip_suffix(".p2p.start9.to") {
            let (hrp, data) = bech32::decode(b32).with_kind(ErrorKind::ParseNetAddress)?;
            ensure_code!(
                hrp == HRP,
                ErrorKind::ParseNetAddress,
                "not an iroh address"
            );
            Ok(Self(
                NodeId::from_bytes(&*<Box<[u8; 32]>>::try_from(data).map_err(|_| {
                    Error::new(eyre!("invalid length"), ErrorKind::ParseNetAddress)
                })?)
                .with_kind(ErrorKind::ParseNetAddress)?,
            ))
        } else {
            Err(Error::new(
                eyre!("Invalid iroh address"),
                ErrorKind::ParseNetAddress,
            ))
        }
    }
}
impl Serialize for IrohAddress {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serialize_display(self, serializer)
    }
}
impl<'de> Deserialize<'de> for IrohAddress {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserialize_from_str(deserializer)
    }
}
impl PartialEq for IrohAddress {
    fn eq(&self, other: &Self) -> bool {
        self.0.as_ref() == other.0.as_ref()
    }
}
impl Eq for IrohAddress {}
impl PartialOrd for IrohAddress {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.0.as_ref().partial_cmp(other.0.as_ref())
    }
}
impl Ord for IrohAddress {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.0.as_ref().cmp(other.0.as_ref())
    }
}

#[derive(Clone, Debug)]
pub struct IrohSecretKey(pub SecretKey);
impl IrohSecretKey {
    pub fn iroh_address(&self) -> IrohAddress {
        IrohAddress(self.0.public())
    }
    pub fn generate() -> Self {
        Self(SecretKey::generate(
            &mut ssh_key::rand_core::OsRng::default(),
        ))
    }
}
impl PemEncoding for IrohSecretKey {
    fn from_pem<E: serde::de::Error>(pem: &str) -> Result<Self, E> {
        ed25519_dalek::SigningKey::from_pem(pem)
            .map(From::from)
            .map(Self)
    }
    fn to_pem<E: serde::ser::Error>(&self) -> Result<String, E> {
        self.0.secret().to_pem()
    }
}

#[derive(Default, Debug, Deserialize, Serialize)]
pub struct IrohKeyStore(BTreeMap<IrohAddress, Pem<IrohSecretKey>>);
impl Map for IrohKeyStore {
    type Key = IrohAddress;
    type Value = Pem<IrohSecretKey>;
    fn key_str(key: &Self::Key) -> Result<impl AsRef<str>, Error> {
        Self::key_string(key)
    }
    fn key_string(key: &Self::Key) -> Result<imbl_value::InternedString, Error> {
        Ok(InternedString::from_display(key))
    }
}
impl IrohKeyStore {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn insert(&mut self, key: IrohSecretKey) {
        self.0.insert(key.iroh_address(), Pem::new(key));
    }
}
impl Model<IrohKeyStore> {
    pub fn new_key(&mut self) -> Result<IrohSecretKey, Error> {
        let key = IrohSecretKey::generate();
        self.insert(&key.iroh_address(), &Pem::new(key))?;
        Ok(key)
    }
    pub fn insert_key(&mut self, key: &IrohSecretKey) -> Result<(), Error> {
        self.insert(&key.iroh_address(), Pem::new_ref(key))
    }
    pub fn get_key(&self, address: &IrohAddress) -> Result<IrohSecretKey, Error> {
        self.as_idx(address)
            .or_not_found(lazy_format!("private key for {address}"))?
            .de()
            .map(|k| k.0)
    }
}

pub fn iroh_api<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "list-services",
            from_fn_async(list_services)
                .with_display_serializable()
                .with_custom_display_fn(|handle, result| display_services(handle.params, result))
                .with_about("Display the status of running iroh services")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "key",
            key::<C>().with_about("Manage the iroh service key store"),
        )
}

pub fn key<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "generate",
            from_fn_async(generate_key)
                .with_about("Generate an iroh service key and add it to the key store")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "add",
            from_fn_async(add_key)
                .with_about("Add an iroh service key to the key store")
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
                .with_about("List iroh services with keys in the key store")
                .with_call_remote::<CliContext>(),
        )
}

pub async fn generate_key(ctx: RpcContext) -> Result<IrohAddress, Error> {
    ctx.db
        .mutate(|db| {
            Ok(db
                .as_private_mut()
                .as_key_store_mut()
                .as_iroh_mut()
                .new_key()?
                .iroh_address())
        })
        .await
        .result
}

#[derive(Deserialize, Serialize, Parser)]
pub struct AddKeyParams {
    pub key: Pem<IrohSecretKey>,
}

pub async fn add_key(
    ctx: RpcContext,
    AddKeyParams { key }: AddKeyParams,
) -> Result<IrohAddress, Error> {
    ctx.db
        .mutate(|db| {
            db.as_private_mut()
                .as_key_store_mut()
                .as_iroh_mut()
                .insert_key(&key.0)
        })
        .await
        .result?;
    Ok(key.iroh_address())
}

pub async fn list_keys(ctx: RpcContext) -> Result<BTreeSet<IrohAddress>, Error> {
    ctx.db
        .peek()
        .await
        .into_private()
        .into_key_store()
        .into_iroh()
        .keys()
}

pub fn display_services(
    params: WithIoFormat<Empty>,
    services: BTreeMap<IrohAddress, IrohServiceInfo>,
) -> Result<(), Error> {
    use prettytable::*;

    if let Some(format) = params.format {
        return display_serializable(format, services);
    }

    let mut table = Table::new();
    table.add_row(row![bc => "ADDRESS", "BINDINGS"]);
    for (service, info) in services {
        let row = row![
            &service.to_string(),
            &info
                .bindings
                .into_iter()
                .map(|((subdomain, port), addr)| lazy_format!("{subdomain}:{port} -> {addr}"))
                .join("; ")
        ];
        table.add_row(row);
    }
    table.print_tty(false)?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IrohServiceInfo {
    pub bindings: BTreeMap<(InternedString, u16), SocketAddr>,
}

pub async fn list_services(
    ctx: RpcContext,
    _: Empty,
) -> Result<BTreeMap<IrohAddress, IrohServiceInfo>, Error> {
    ctx.net_controller.iroh.list_services().await
}

#[derive(Clone)]
pub struct IrohController(Arc<IrohControllerInner>);
struct IrohControllerInner {
    // client: Endpoint,
    services: SyncMutex<BTreeMap<IrohAddress, IrohService>>,
}
impl IrohController {
    pub fn new() -> Result<Self, Error> {
        Ok(Self(Arc::new(IrohControllerInner {
            services: SyncMutex::new(BTreeMap::new()),
        })))
    }

    pub fn service(&self, key: IrohSecretKey) -> Result<IrohService, Error> {
        self.0.services.mutate(|s| {
            use std::collections::btree_map::Entry;
            let addr = key.iroh_address();
            match s.entry(addr) {
                Entry::Occupied(e) => Ok(e.get().clone()),
                Entry::Vacant(e) => Ok(e
                    .insert(IrohService::launch(self.0.client.clone(), key)?)
                    .clone()),
            }
        })
    }

    pub async fn gc(&self, addr: Option<IrohAddress>) -> Result<(), Error> {
        if let Some(addr) = addr {
            if let Some(s) = self.0.services.mutate(|s| {
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
            for s in self.0.services.mutate(|s| {
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

    pub async fn list_services(&self) -> Result<BTreeMap<IrohAddress, IrohServiceInfo>, Error> {
        Ok(self
            .0
            .services
            .peek(|s| s.iter().map(|(a, s)| (a.clone(), s.info())).collect()))
    }

    pub async fn connect_iroh(
        &self,
        addr: &IrohAddress,
        port: u16,
    ) -> Result<Box<dyn ReadWriter + Unpin + Send + Sync + 'static>, Error> {
        if let Some(target) = self.0.services.peek(|s| {
            s.get(addr).and_then(|s| {
                s.0.bindings.peek(|b| {
                    b.get(&port).and_then(|b| {
                        b.iter()
                            .find(|(_, rc)| rc.strong_count() > 0)
                            .map(|(a, _)| *a)
                    })
                })
            })
        }) {
            Ok(Box::new(
                TcpStream::connect(target)
                    .await
                    .with_kind(ErrorKind::Network)?,
            ))
        } else {
            todo!()
        }
    }
}

#[derive(Clone)]
pub struct IrohService(Arc<IrohServiceData>);
struct IrohServiceData {
    service: Endpoint,
    bindings: Arc<SyncRwLock<BTreeMap<(InternedString, u16), BTreeMap<SocketAddr, Weak<()>>>>>,
    _thread: NonDetachingJoinHandle<()>,
}
impl IrohService {
    fn launch(
        mut client: Watch<(usize, IrohClient<TokioRustlsRuntime>)>,
        key: IrohSecretKey,
    ) -> Result<Self, Error> {
        let service = Arc::new(SyncMutex::new(None));
        let bindings = Arc::new(SyncRwLock::new(BTreeMap::<
            u16,
            BTreeMap<SocketAddr, Weak<()>>,
        >::new()));
        Ok(Self(Arc::new(IrohServiceData {
            service: service.clone(),
            bindings: bindings.clone(),
            _thread: tokio::spawn(async move {
                let (bg, mut runner) = BackgroundJobQueue::new();
                runner
                    .run_while(async {
                        loop {
                            if let Err(e) = async {
                                client.wait_for(|(_,c)| c.bootstrap_status().ready_for_traffic()).await;
                                let epoch = client.peek(|(e, c)| {
                                    ensure_code!(c.bootstrap_status().ready_for_traffic(), ErrorKind::Iroh, "client recycled");
                                    Ok::<_, Error>(*e)
                                })?;
                                let (new_service, stream) = client.peek(|(_, c)| {
                                    c.launch_onion_service_with_hsid(
                                        IrohServiceConfigBuilder::default()
                                            .nickname(
                                                key.iroh_address()
                                                    .to_string()
                                                    .trim_end_matches(".onion")
                                                    .parse::<HsNickname>()
                                                    .with_kind(ErrorKind::Iroh)?,
                                            )
                                            .build()
                                            .with_kind(ErrorKind::Iroh)?,
                                        key.clone().0,
                                    )
                                    .with_kind(ErrorKind::Iroh)
                                })?;
                                let mut status_stream = new_service.status_events();
                                bg.add_job(async move {
                                    while let Some(status) = status_stream.next().await {
                                        // TODO: health daemon?
                                    }
                                });
                                service.replace(Some(new_service));
                                let mut stream = tor_hsservice::handle_rend_requests(stream);
                                while let Some(req) = tokio::select! {
                                    req = stream.next() => req,
                                    _ = client.wait_for(|(e, _)| *e != epoch) => None
                                } {
                                    bg.add_job({
                                        let bg = bg.clone();
                                        let bindings = bindings.clone();
                                        async move {
                                            if let Err(e) = async {
                                                let IncomingStreamRequest::Begin(begin) =
                                                    req.request()
                                                else {
                                                    return req
                                                        .reject(tor_cell::relaycell::msg::End::new_with_reason(
                                                            tor_cell::relaycell::msg::EndReason::DONE,
                                                        ))
                                                        .await
                                                        .with_kind(ErrorKind::Iroh);
                                                };
                                                let Some(target) = bindings.peek(|b| {
                                                    b.get(&begin.port()).and_then(|a| {
                                                        a.iter()
                                                            .find(|(_, rc)| rc.strong_count() > 0)
                                                            .map(|(addr, _)| *addr)
                                                    })
                                                }) else {
                                                    return req
                                                        .reject(tor_cell::relaycell::msg::End::new_with_reason(
                                                            tor_cell::relaycell::msg::EndReason::DONE,
                                                        ))
                                                        .await
                                                        .with_kind(ErrorKind::Iroh);
                                                };
                                                bg.add_job(async move {
                                                    if let Err(e) = async {
                                                        let mut outgoing =
                                                            TcpStream::connect(target)
                                                                .await
                                                                .with_kind(ErrorKind::Network)?;
                                                        let mut incoming = req
                                                            .accept(Connected::new_empty())
                                                            .await
                                                            .with_kind(ErrorKind::Iroh)?;
                                                        if let Err(e) =
                                                            tokio::io::copy_bidirectional(
                                                                &mut outgoing,
                                                                &mut incoming,
                                                            )
                                                            .await
                                                        {
                                                            tracing::error!("Iroh Stream Error: {e}");
                                                            tracing::debug!("{e:?}");
                                                        }

                                                        Ok::<_, Error>(())
                                                    }
                                                    .await
                                                    {
                                                        tracing::trace!("Iroh Stream Error: {e}");
                                                        tracing::trace!("{e:?}");
                                                    }
                                                });
                                                Ok::<_, Error>(())
                                            }
                                            .await
                                            {
                                                tracing::trace!("Iroh Request Error: {e}");
                                                tracing::trace!("{e:?}");
                                            }
                                        }
                                    });
                                }
                                Ok::<_, Error>(())
                            }
                            .await
                            {
                                tracing::error!("Iroh Client Error: {e}");
                                tracing::debug!("{e:?}");
                            }
                        }
                    })
                    .await
            })
            .into(),
        })))
    }

    pub fn proxy_all<Rcs: FromIterator<Arc<()>>>(
        &self,
        bindings: impl IntoIterator<Item = (InternedString, u16, SocketAddr)>,
    ) -> Rcs {
        self.0.bindings.mutate(|b| {
            bindings
                .into_iter()
                .map(|(subdomain, port, target)| {
                    let entry = b
                        .entry((subdomain, port))
                        .or_default()
                        .entry(target)
                        .or_default();
                    if let Some(rc) = entry.upgrade() {
                        rc
                    } else {
                        let rc = Arc::new(());
                        *entry = Arc::downgrade(&rc);
                        rc
                    }
                })
                .collect()
        })
    }

    pub fn gc(&self) -> bool {
        self.0.bindings.mutate(|b| {
            b.retain(|_, targets| {
                targets.retain(|_, rc| rc.strong_count() > 0);
                !targets.is_empty()
            });
            !b.is_empty()
        })
    }

    pub async fn shutdown(self) -> Result<(), Error> {
        self.0.service.replace(None);
        self.0._thread.abort();
        Ok(())
    }

    pub fn state(&self) -> IrohServiceState {
        self.0
            .service
            .peek(|s| s.as_ref().map(|s| s.status().state().into()))
            .unwrap_or(IrohServiceState::Bootstrapping)
    }

    pub fn info(&self) -> IrohServiceInfo {
        IrohServiceInfo {
            state: self.state(),
            bindings: self.0.bindings.peek(|b| {
                b.iter()
                    .filter_map(|(port, b)| {
                        b.iter()
                            .find(|(_, rc)| rc.strong_count() > 0)
                            .map(|(addr, _)| (*port, *addr))
                    })
                    .collect()
            }),
        }
    }
}

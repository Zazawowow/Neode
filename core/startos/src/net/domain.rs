use std::collections::BTreeMap;

use clap::Parser;
use futures::TryFutureExt;
use helpers::NonDetachingJoinHandle;
use imbl_value::InternedString;
use models::GatewayId;
use rpc_toolkit::{from_fn_async, Context, HandlerArgs, HandlerExt, ParentHandler};
use serde::{Deserialize, Serialize};

use crate::context::{CliContext, RpcContext};
use crate::db::model::public::DomainSettings;
use crate::prelude::*;
use crate::util::new_guid;
use crate::util::serde::{display_serializable, HandlerExtSerde};

pub fn domain_api<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "list",
            from_fn_async(list)
                .with_display_serializable()
                .with_custom_display_fn(|HandlerArgs { params, .. }, res| {
                    use prettytable::*;

                    if let Some(format) = params.format {
                        return display_serializable(format, res);
                    }

                    let mut table = Table::new();
                    table.add_row(row![bc => "DOMAIN", "GATEWAY"]);
                    for (domain, info) in res {
                        table.add_row(row![domain, info.gateway]);
                    }

                    table.print_tty(false)?;

                    Ok(())
                })
                .with_about("List domains available to StartOS")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "add",
            from_fn_async(add)
                .with_metadata("sync_db", Value::Bool(true))
                .no_display()
                .with_about("Add a domain for use with StartOS")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "remove",
            from_fn_async(remove)
                .with_metadata("sync_db", Value::Bool(true))
                .no_display()
                .with_about("Remove a domain for use with StartOS")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "test-dns",
            from_fn_async(test_dns)
                .with_display_serializable()
                .with_custom_display_fn(|HandlerArgs { params, .. }, res| {
                    use prettytable::*;

                    if let Some(format) = params.format {
                        return display_serializable(format, res);
                    }

                    let mut table = Table::new();
                    table.add_row(row![bc -> "ROOT", if res.root { "✅️" } else { "❌️" }]);
                    table.add_row(row![bc -> "WILDCARD", if res.wildcard { "✅️" } else { "❌️" }]);

                    table.print_tty(false)?;

                    Ok(())
                })
                .with_about("Test the DNS configuration for a domain"),
        )
}

pub async fn list(ctx: RpcContext) -> Result<BTreeMap<InternedString, DomainSettings>, Error> {
    ctx.db
        .peek()
        .await
        .into_public()
        .into_server_info()
        .into_network()
        .into_domains()
        .de()
}

#[derive(Deserialize, Serialize, Parser)]
pub struct AddDomainParams {
    pub fqdn: InternedString,
    pub gateway: GatewayId,
}

pub async fn add(
    ctx: RpcContext,
    AddDomainParams { fqdn, gateway }: AddDomainParams,
) -> Result<(), Error> {
    ctx.db
        .mutate(|db| {
            db.as_public_mut()
                .as_server_info_mut()
                .as_network_mut()
                .as_domains_mut()
                .insert(&fqdn, &DomainSettings { gateway })
        })
        .await
        .result?;
    Ok(())
}

#[derive(Deserialize, Serialize, Parser)]
pub struct RemoveDomainParams {
    pub fqdn: InternedString,
}

pub async fn remove(
    ctx: RpcContext,
    RemoveDomainParams { fqdn }: RemoveDomainParams,
) -> Result<(), Error> {
    ctx.db
        .mutate(|db| {
            db.as_public_mut()
                .as_server_info_mut()
                .as_network_mut()
                .as_domains_mut()
                .remove(&fqdn)
        })
        .await
        .result?;
    Ok(())
}

#[derive(Deserialize, Serialize)]
pub struct TestDnsResult {
    pub root: bool,
    pub wildcard: bool,
}

pub async fn test_dns(
    ctx: RpcContext,
    AddDomainParams { fqdn, ref gateway }: AddDomainParams,
) -> Result<TestDnsResult, Error> {
    use tokio::net::UdpSocket;
    use trust_dns_client::client::{AsyncClient, ClientHandle};
    use trust_dns_client::op::DnsResponse;
    use trust_dns_client::proto::error::ProtoError;
    use trust_dns_client::rr::{DNSClass, Name, RecordType};
    use trust_dns_client::udp::UdpClientStream;

    let wan_ip = ctx
        .db
        .peek()
        .await
        .into_public()
        .into_server_info()
        .into_network()
        .into_gateways()
        .into_idx(&gateway)
        .or_not_found(&gateway)?
        .into_ip_info()
        .transpose()
        .and_then(|i| i.into_wan_ip().transpose())
        .or_not_found(lazy_format!("WAN IP for {gateway}"))?
        .de()?;
    let stream = UdpClientStream::<UdpSocket>::new(([127, 0, 0, 53], 53).into());
    let (mut client, bg) = AsyncClient::connect(stream.map_err(ProtoError::from))
        .await
        .with_kind(ErrorKind::Network)?;
    let bg: NonDetachingJoinHandle<_> = tokio::spawn(bg).into();

    let root = fqdn.parse::<Name>().with_kind(ErrorKind::Network)?;
    let wildcard = new_guid()
        .parse::<Name>()
        .with_kind(ErrorKind::Network)?
        .append_domain(&root)
        .with_kind(ErrorKind::Network)?;
    let q_root = client
        .query(root, DNSClass::IN, RecordType::A)
        .await
        .with_kind(ErrorKind::Network)?;
    let q_wildcard = client
        .query(wildcard, DNSClass::IN, RecordType::A)
        .await
        .with_kind(ErrorKind::Network)?;

    bg.abort();

    let check_q = |q: DnsResponse| {
        q.answers().iter().any(|a| {
            a.data()
                .and_then(|d| d.as_a())
                .map_or(false, |d| d.0 == wan_ip)
        })
    };
    Ok(TestDnsResult {
        root: check_q(q_root),
        wildcard: check_q(q_wildcard),
    })
}

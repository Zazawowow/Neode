use clap::Parser;
use imbl_value::InternedString;
use models::GatewayId;
use rpc_toolkit::{from_fn_async, Context, HandlerExt, ParentHandler};
use serde::{Deserialize, Serialize};
use tokio::process::Command;
use ts_rs::TS;

use crate::context::{CliContext, RpcContext};
use crate::db::model::public::NetworkInterfaceType;
use crate::prelude::*;
use crate::util::io::{write_file_atomic, TmpDir};
use crate::util::Invoke;

pub fn tunnel_api<C: Context>() -> ParentHandler<C> {
    ParentHandler::new()
        .subcommand(
            "add",
            from_fn_async(add_tunnel)
                .with_about("Add a new tunnel")
                .with_call_remote::<CliContext>(),
        )
        .subcommand(
            "remove",
            from_fn_async(remove_tunnel)
                .no_display()
                .with_about("Remove a tunnel")
                .with_call_remote::<CliContext>(),
        )
}

#[derive(Debug, Clone, Deserialize, Serialize, Parser, TS)]
#[ts(export)]
pub struct AddTunnelParams {
    #[ts(type = "string")]
    name: InternedString,
    config: String,
    public: bool,
}

pub async fn add_tunnel(
    ctx: RpcContext,
    AddTunnelParams {
        name,
        config,
        public,
    }: AddTunnelParams,
) -> Result<GatewayId, Error> {
    let existing = ctx
        .db
        .peek()
        .await
        .into_public()
        .into_server_info()
        .into_network()
        .into_network_interfaces()
        .keys()?;
    let mut iface = GatewayId::from("wg0");
    for id in 1.. {
        if !existing.contains(&iface) {
            break;
        }
        iface = InternedString::from_display(&lazy_format!("wg{id}")).into();
    }
    let tmpdir = TmpDir::new().await?;
    let conf = tmpdir.join(&iface).with_extension("conf");
    write_file_atomic(&conf, &config).await?;
    let mut ifaces = ctx.net_controller.net_iface.watcher.subscribe();
    Command::new("nmcli")
        .arg("connection")
        .arg("import")
        .arg("type")
        .arg("wireguard")
        .arg("file")
        .arg(&conf)
        .invoke(ErrorKind::Network)
        .await?;
    tmpdir.delete().await?;

    ifaces.wait_for(|ifaces| ifaces.contains_key(&iface)).await;

    ctx.net_controller
        .net_iface
        .set_public(&iface, Some(public))
        .await?;

    ctx.net_controller.net_iface.set_name(&iface, &name).await?;

    Ok(iface)
}

#[derive(Debug, Clone, Deserialize, Serialize, Parser, TS)]
#[ts(export)]
pub struct RemoveTunnelParams {
    id: GatewayId,
}
pub async fn remove_tunnel(
    ctx: RpcContext,
    RemoveTunnelParams { id }: RemoveTunnelParams,
) -> Result<(), Error> {
    let Some(existing) = ctx
        .db
        .peek()
        .await
        .into_public()
        .into_server_info()
        .into_network()
        .into_network_interfaces()
        .into_idx(&id)
        .and_then(|e| e.into_ip_info().transpose())
    else {
        return Ok(());
    };

    if existing.as_device_type().de()? != Some(NetworkInterfaceType::Wireguard) {
        return Err(Error::new(
            eyre!("network interface {id} is not a proxy"),
            ErrorKind::InvalidRequest,
        ));
    }

    ctx.net_controller.net_iface.delete_iface(&id).await?;

    Ok(())
}

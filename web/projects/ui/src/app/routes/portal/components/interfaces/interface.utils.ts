import { inject, Injectable } from '@angular/core'
import { T, utils } from '@start9labs/start-sdk'
import { ConfigService } from 'src/app/services/config.service'

type AddressWithInfo = {
  address: URL
  info: T.HostnameInfo
}

function cmpWithRankedPredicates<T extends AddressWithInfo>(
  a: T,
  b: T,
  preds: ((x: T) => boolean)[],
): -1 | 0 | 1 {
  for (const pred of preds) {
    for (let [x, y, sign] of [[a, b, 1] as const, [b, a, -1] as const]) {
      if (pred(x) && !pred(y)) return sign
    }
  }
  return 0
}

type TorAddress = AddressWithInfo & { info: { kind: 'onion' } }
function filterTor(a: AddressWithInfo): a is TorAddress {
  return a.info.kind === 'onion'
}
function cmpTor(a: TorAddress, b: TorAddress): -1 | 0 | 1 {
  for (let [x, y, sign] of [[a, b, 1] as const, [b, a, -1] as const]) {
    if (x.address.protocol === 'http:' && y.address.protocol === 'https:')
      return sign
  }
  return 0
}

type LanAddress = AddressWithInfo & { info: { kind: 'ip'; public: false } }
function filterLan(a: AddressWithInfo): a is LanAddress {
  return a.info.kind === 'ip' && !a.info.public
}
function cmpLan(host: T.Host, a: LanAddress, b: LanAddress): -1 | 0 | 1 {
  return cmpWithRankedPredicates(a, b, [
    x =>
      x.info.hostname.kind === 'domain' &&
      !host.domains[x.info.hostname.value]?.public, // private domain
    x => x.info.hostname.kind === 'local', // .local
    x => x.info.hostname.kind === 'ipv4', // ipv4
    x => x.info.hostname.kind === 'ipv6', // ipv6
    // remainder: public domains accessible privately
  ])
}

type VpnAddress = AddressWithInfo & {
  info: {
    kind: 'ip'
    public: false
    hostname: { kind: 'ipv4' | 'ipv6' | 'domain' }
  }
}
function filterVpn(a: AddressWithInfo): a is VpnAddress {
  return (
    a.info.kind === 'ip' && !a.info.public && a.info.hostname.kind !== 'local'
  )
}
function cmpVpn(host: T.Host, a: VpnAddress, b: VpnAddress): -1 | 0 | 1 {
  return cmpWithRankedPredicates(a, b, [
    x =>
      x.info.hostname.kind === 'domain' &&
      !host.domains[x.info.hostname.value]?.public, // private domain
    x => x.info.hostname.kind === 'ipv4', // ipv4
    x => x.info.hostname.kind === 'ipv6', // ipv6
    // remainder: public domains accessible privately
  ])
}

type ClearnetAddress = AddressWithInfo & {
  info: {
    kind: 'ip'
    public: true
    hostname: { kind: 'ipv4' | 'ipv6' | 'domain' }
  }
}
function filterClearnet(a: AddressWithInfo): a is ClearnetAddress {
  return a.info.kind === 'ip' && a.info.public
}
function cmpClearnet(
  domains: Record<string, T.DomainSettings>,
  host: T.Host,
  a: ClearnetAddress,
  b: ClearnetAddress,
): -1 | 0 | 1 {
  return cmpWithRankedPredicates(a, b, [
    x =>
      x.info.hostname.kind === 'domain' &&
      x.info.gatewayId ===
        domains[host.domains[x.info.hostname.value]?.root!]?.gateway, // public domain for this gateway
    x => x.info.hostname.kind === 'ipv4', // ipv4
    x => x.info.hostname.kind === 'ipv6', // ipv6
    // remainder: private domains / domains public on other gateways
  ])
}

function toDisplayAddress(a: AddressWithInfo): Address {
  throw new Error('@TODO: MattHill')
}

@Injectable({
  providedIn: 'root',
})
export class InterfaceService {
  private readonly config = inject(ConfigService)

  getAddresses(
    serverDomains: Record<string, T.DomainSettings>,
    serviceInterface: T.ServiceInterface,
    host: T.Host,
  ): MappedServiceInterface['addresses'] {
    const hostnamesInfos = this.hostnameInfo(serviceInterface, host)

    const addresses = {
      common: [],
      uncommon: [],
    }

    if (!hostnamesInfos.length) return addresses

    const allAddressesWithInfo: AddressWithInfo[] = hostnamesInfos.flatMap(h =>
      utils
        .addressHostToUrl(serviceInterface.addressInfo, h)
        .map(a => ({ address: new URL(a), info: h })),
    )

    const torAddrs = allAddressesWithInfo.filter(filterTor).sort(cmpTor)
    const lanAddrs = allAddressesWithInfo
      .filter(filterLan)
      .sort((a, b) => cmpLan(host, a, b))
    const vpnAddrs = allAddressesWithInfo
      .filter(filterVpn)
      .sort((a, b) => cmpVpn(host, a, b))
    const clearnetAddrs = allAddressesWithInfo
      .filter(filterClearnet)
      .sort((a, b) => cmpClearnet(serverDomains, host, a, b))

    let bestAddrs = [clearnetAddrs[0], lanAddrs[0], vpnAddrs[0], torAddrs[0]]
      .filter(a => !!a)
      .reduce((acc, x) => {
        if (!acc.includes(x)) acc.push(x)
        return acc
      }, [] as AddressWithInfo[])

    return {
      common: bestAddrs.map(toDisplayAddress),
      uncommon: allAddressesWithInfo
        .filter(a => !bestAddrs.includes(a))
        .map(toDisplayAddress),
    }
  }

  /** ${scheme}://${username}@${host}:${externalPort}${suffix} */
  launchableAddress(ui: T.ServiceInterface, host: T.Host): string {
    const hostnameInfos = this.hostnameInfo(ui, host)

    if (!hostnameInfos.length) return ''

    const addressInfo = ui.addressInfo
    const username = addressInfo.username ? addressInfo.username + '@' : ''
    const suffix = addressInfo.suffix || ''
    const url = new URL(`https://${username}placeholder${suffix}`)
    const use = (hostname: {
      value: string
      port: number | null
      sslPort: number | null
    }) => {
      url.hostname = hostname.value
      const useSsl =
        hostname.port && hostname.sslPort
          ? this.config.isHttps()
          : !!hostname.sslPort
      url.protocol = useSsl
        ? `${addressInfo.sslScheme || 'https'}:`
        : `${addressInfo.scheme || 'http'}:`
      const port = useSsl ? hostname.sslPort : hostname.port
      const omitPort = useSsl
        ? ui.addressInfo.sslScheme === 'https' && port === 443
        : ui.addressInfo.scheme === 'http' && port === 80
      if (!omitPort && port) url.port = String(port)
    }
    const useFirst = (
      hostnames: (
        | {
            value: string
            port: number | null
            sslPort: number | null
          }
        | undefined
      )[],
    ) => {
      const first = hostnames.find(h => h)
      if (first) {
        use(first)
      }
      return !!first
    }

    const ipHostnames = hostnameInfos
      .filter(h => h.kind === 'ip')
      .map(h => h.hostname) as T.IpHostname[]
    const domainHostname = ipHostnames
      .filter(h => h.kind === 'domain')
      .map(h => h as T.IpHostname & { kind: 'domain' })
      .map(h => ({
        value: h.value,
        sslPort: h.sslPort,
        port: h.port,
      }))[0]
    const wanIpHostname = hostnameInfos
      .filter(h => h.kind === 'ip' && h.public && h.hostname.kind !== 'domain')
      .map(h => h.hostname as Exclude<T.IpHostname, { kind: 'domain' }>)
      .map(h => ({
        value: h.value,
        sslPort: h.sslPort,
        port: h.port,
      }))[0]
    const onionHostname = hostnameInfos
      .filter(h => h.kind === 'onion')
      .map(h => h as T.HostnameInfo & { kind: 'onion' })
      .map(h => ({
        value: h.hostname.value,
        sslPort: h.hostname.sslPort,
        port: h.hostname.port,
      }))[0]
    const localHostname = ipHostnames
      .filter(h => h.kind === 'local')
      .map(h => h as T.IpHostname & { kind: 'local' })
      .map(h => ({ value: h.value, sslPort: h.sslPort, port: h.port }))[0]

    if (this.config.isClearnet()) {
      if (
        !useFirst([domainHostname, wanIpHostname, onionHostname, localHostname])
      ) {
        return ''
      }
    } else if (this.config.isTor()) {
      if (
        !useFirst([onionHostname, domainHostname, wanIpHostname, localHostname])
      ) {
        return ''
      }
    } else if (this.config.isIpv6()) {
      const ipv6Hostname = ipHostnames.find(h => h.kind === 'ipv6') as {
        kind: 'ipv6'
        value: string
        scopeId: number
        port: number | null
        sslPort: number | null
      }

      if (!useFirst([ipv6Hostname, localHostname])) {
        return ''
      }
    } else {
      // ipv4 or .local or localhost

      if (!localHostname) return ''

      use({
        value: this.config.hostname,
        port: localHostname.port,
        sslPort: localHostname.sslPort,
      })
    }

    return url.href
  }

  private hostnameInfo(
    serviceInterface: T.ServiceInterface,
    host: T.Host,
  ): T.HostnameInfo[] {
    let hostnameInfo =
      host.hostnameInfo[serviceInterface.addressInfo.internalPort]
    return (
      hostnameInfo?.filter(
        h =>
          this.config.isLocalhost() ||
          !(
            h.kind === 'ip' &&
            ((h.hostname.kind === 'ipv6' &&
              utils.IPV6_LINK_LOCAL.contains(h.hostname.value)) ||
              h.gatewayId === 'lo')
          ),
      ) || []
    )
  }
}

export type MappedServiceInterface = T.ServiceInterface & {
  gateways: InterfaceGateway[]
  torDomains: string[]
  clearnetDomains: ClearnetDomain[]
  addresses: {
    common: Address[]
    uncommon: Address[]
  }
  isOs: boolean
}

export type InterfaceGateway = {
  id: string
  name: string
  enabled: boolean
  public: boolean
}

export type ClearnetDomain = {
  fqdn: string
  authority: string | null
  public: boolean
}

export type Address = {
  type: string
  gateway: string
  url: string
  description: string
}

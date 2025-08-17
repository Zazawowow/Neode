import { inject, Injectable } from '@angular/core'
import { T, utils } from '@start9labs/start-sdk'
import { ConfigService } from 'src/app/services/config.service'
import { GatewayPlus } from 'src/app/services/gateway.service'
import { PublicDomain } from './public-domains/pd.service'
import { i18nKey } from '@start9labs/shared'

type AddressWithInfo = {
  url: URL
  info: T.HostnameInfo
}

function cmpWithRankedPredicates<T extends AddressWithInfo>(
  a: T,
  b: T,
  preds: ((x: T) => boolean)[],
): -1 | 0 | 1 {
  for (const pred of preds) {
    for (let [x, y, sign] of [[a, b, 1] as const, [b, a, -1] as const]) {
      if (pred(y) && !pred(x)) return sign
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
    if (y.url.protocol === 'http:' && x.url.protocol === 'https:') return sign
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
      !!host.privateDomains.find(d => d === x.info.hostname.value), // private domain
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
      !!host.privateDomains.find(d => d === x.info.hostname.value), // private domain
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
  host: T.Host,
  a: ClearnetAddress,
  b: ClearnetAddress,
): -1 | 0 | 1 {
  return cmpWithRankedPredicates(a, b, [
    x =>
      x.info.hostname.kind === 'domain' &&
      x.info.gatewayId === host.publicDomains[x.info.hostname.value]?.gateway, // public domain for this gateway
    x => x.info.hostname.kind === 'ipv4', // ipv4
    x => x.info.hostname.kind === 'ipv6', // ipv6
    // remainder: private domains / domains public on other gateways
  ])
}

// @TODO translations
function toDisplayAddress(
  { info, url }: AddressWithInfo,
  gateways: GatewayPlus[],
  publicDomains: Record<string, T.PublicDomainConfig>,
): DisplayAddress {
  let access: DisplayAddress['access']
  let gatewayName: DisplayAddress['gatewayName']
  let type: DisplayAddress['type']
  let bullets: any[]
  // let bullets: DisplayAddress['bullets']

  const rootCaRequired = `Requires trusting your server's Root CA`

  // ** Tor **
  if (info.kind === 'onion') {
    access = null
    gatewayName = null
    type = 'Tor'
    bullets = [
      'Connections can be slow or unreliable at times',
      'Public if you share the address publicly, otherwise private',
      'Requires using a Tor-enabled device or browser',
    ]
    // Tor (HTTPS)
    if (url.protocol.startsWith('https')) {
      type = `${type} (HTTPS)`
      bullets = [
        'Only useful for clients that enforce HTTPS',
        rootCaRequired,
        ...bullets,
      ]
      // Tor (HTTP)
    } else {
      bullets.unshift(
        'Ideal for anonymous, censorship-resistant hosting and remote access',
      )
      type = `${type} (HTTP)`
    }
    // ** Not Tor **
  } else {
    const port = info.hostname.sslPort || info.hostname.port
    const gateway = gateways.find(g => g.id === info.gatewayId)!
    gatewayName = gateway.ipInfo.name

    const gatewayLanIpv4 = gateway.lanIpv4[0]
    const isWireguard = gateway.ipInfo.deviceType === 'wireguard'

    const localIdeal = 'Ideal for local access'
    const lanRequired =
      'Requires being connected to the same Local Area Network (LAN) as your server, either physically or via VPN'
    const staticRequired = `Requires setting a static IP address for ${gatewayLanIpv4} in your gateway`
    const vpnAccess = 'Ideal for VPN access via your'

    // * Local *
    if (info.hostname.kind === 'local') {
      type = 'Local'
      access = 'private'
      bullets = [
        localIdeal,
        'Not recommended for VPN access. VPNs do not support ".local" domains without advanced configuration',
        lanRequired,
        rootCaRequired,
      ]
      // * IPv4 *
    } else if (info.hostname.kind === 'ipv4') {
      type = 'IPv4'
      if (info.public) {
        access = 'public'
        bullets = [
          'Can be used for clearnet access',
          'Not recommended in most cases. Clearnet domains are preferred',
          rootCaRequired,
        ]
        if (!gateway.public) {
          bullets.push(
            `Requires port forwarding in gateway "${gatewayName}": ${port} -> ${info.hostname.value}:${port}`,
          )
        }
      } else {
        access = 'private'
        if (isWireguard) {
          bullets = [`${vpnAccess} StartTunnel (or similar)`, rootCaRequired]
        } else {
          bullets = [
            localIdeal,
            `${vpnAccess} router's Wireguard server`,
            lanRequired,
            rootCaRequired,
            staticRequired,
          ]
        }
      }
      // * IPv6 *
    } else if (info.hostname.kind === 'ipv6') {
      type = 'IPv6'
      access = 'private'
      bullets = ['Can be used for local access', lanRequired, rootCaRequired]
      // * Domain *
    } else {
      type = 'Domain'
      if (info.public) {
        access = 'public'
        bullets = [
          `Requires a DNS record for ${info.hostname.value} that resolves to ${gateway.ipInfo.wanIp}`,
          `Requires port forwarding in gateway "${gatewayName}": ${port} -> ${info.hostname.value}:${port === 443 ? 5443 : port}`,
        ]
        if (publicDomains[info.hostname.value]?.acme) {
          bullets.unshift('Ideal for public access via the Internet')
        } else {
          bullets = [
            'Can be used for personal access via the public Internet. VPN is more private and secure',
            rootCaRequired,
            ...bullets,
          ]
        }
      } else {
        access = 'private'
        const ipPortBad = 'when using IP addresses and ports is undesirable'
        const customDnsRequired = `Requires a DNS record for ${info.hostname.value} that resolves to ${gatewayLanIpv4}`
        if (isWireguard) {
          bullets = [
            `${vpnAccess} StartTunnel (or similar) ${ipPortBad}`,
            customDnsRequired,
            rootCaRequired,
          ]
        } else {
          bullets = [
            `${localIdeal} ${ipPortBad}`,
            `${vpnAccess} router's Wireguard server ${ipPortBad}`,
            customDnsRequired,
            rootCaRequired,
            lanRequired,
            staticRequired,
          ]
        }
      }
    }
  }

  return {
    url: url.href,
    access,
    gatewayName,
    type,
    bullets,
  }
}

export function getPublicDomains(
  publicDomains: Record<string, T.PublicDomainConfig>,
  gateways: GatewayPlus[],
): PublicDomain[] {
  return Object.entries(publicDomains).map(([fqdn, info]) => ({
    fqdn,
    acme: info.acme,
    gateway: gateways.find(g => g.id === info.gateway) || null,
  }))
}

@Injectable({
  providedIn: 'root',
})
export class InterfaceService {
  private readonly config = inject(ConfigService)

  getAddresses(
    serviceInterface: T.ServiceInterface,
    host: T.Host,
    gateways: GatewayPlus[],
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
        .map(a => ({ url: new URL(a), info: h })),
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
      .sort((a, b) => cmpClearnet(host, a, b))

    let bestAddrs = [clearnetAddrs[0], lanAddrs[0], vpnAddrs[0], torAddrs[0]]
      .filter(a => !!a)
      .reduce((acc, x) => {
        if (!acc.includes(x)) acc.push(x)
        return acc
      }, [] as AddressWithInfo[])

    return {
      common: bestAddrs.map(a =>
        toDisplayAddress(a, gateways, host.publicDomains),
      ),
      uncommon: allAddressesWithInfo
        .filter(a => !bestAddrs.includes(a))
        .map(a => toDisplayAddress(a, gateways, host.publicDomains)),
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
  publicDomains: PublicDomain[]
  privateDomains: string[]
  addresses: {
    common: DisplayAddress[]
    uncommon: DisplayAddress[]
  }
  isOs: boolean
}

export type InterfaceGateway = GatewayPlus & {
  enabled: boolean
}

export type DisplayAddress = {
  type: string
  access: 'public' | 'private' | null
  gatewayName: string | null
  url: string
  bullets: i18nKey[]
}

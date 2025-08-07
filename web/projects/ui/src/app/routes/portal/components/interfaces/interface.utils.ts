import { inject, Injectable } from '@angular/core'
import { T, utils } from '@start9labs/start-sdk'
import { ConfigService } from 'src/app/services/config.service'

type AddressWithInfo = {
  address: URL
  info: T.HostnameInfo
}

function filterTor(a: AddressWithInfo): a is (AddressWithInfo & { info: { kind: 'onion' } }) {
  return a.info.kind === 'onion'
}

function cmpTor(a: AddressWithInfo, b: AddressWithInfo): -1 | 0 | 1 {
  if (!filterTor(a) || !filterTor(b)) return 0
  for (let [x, y, sign] of [[a, b, 1] as const, [b, a, -1] as const]) {
    if (x.address.protocol === 'http:' && y.address.protocol === 'https:')
      return sign
  }
  return 0
}

function filterLan(a: AddressWithInfo): a is (AddressWithInfo & { info: { kind: 'ip', public: false } }) {
  return a.info.kind === 'ip' && !a.info.public
}

function cmpLan(host: T.Host, a: AddressWithInfo, b: AddressWithInfo): -1 | 0 | 1 {
  if (!filterLan(a) || !filterLan(b)) return 0
  for (let [x, y, sign] of [[a, b, 1] as const, [b, a, -1] as const]) {
    if (x.info.kind === 'domain' && host.domains.)
      return sign
  }
  return 0
}

@Injectable({
  providedIn: 'root',
})
export class InterfaceService {
  private readonly config = inject(ConfigService)

  getAddresses(
    serviceInterface: T.ServiceInterface,
    host: T.Host,
  ): MappedServiceInterface['addresses'] {
    const hostnamesInfos = this.hostnameInfo(serviceInterface, host)

    const addresses = {
      common: [],
      uncommon: [],
    }

    if (!hostnamesInfos.length) return addresses

    hostnamesInfos.forEach(h => {
      const addresses = utils.addressHostToUrl(serviceInterface.addressInfo, h)

      addresses.forEach(url => {
        if (h.kind === 'onion') {
          tor.push({
            protocol: /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)
              ? new URL(url).protocol.replace(':', '').toUpperCase()
              : null,
            url,
          })
        } else {
          const hostnameKind = h.hostname.kind

          if (
            h.public ||
            (hostnameKind === 'domain' &&
              host.domains[h.hostname.domain]?.public)
          ) {
            clearnet.push({
              url,
              disabled: !h.public,
              isDomain: hostnameKind == 'domain',
              authority:
                hostnameKind == 'domain'
                  ? host.domains[h.hostname.domain]?.acme || null
                  : null,
            })
          } else {
            local.push({
              nid:
                hostnameKind === 'local'
                  ? 'Local'
                  : `${h.gatewayId} (${hostnameKind})`,
              url,
            })
          }
        }
      })
    })

    return {
      common: common.filter(
        (value, index, self) =>
          index === self.findIndex(t => t.url === value.url),
      ),
      uncommon: uncommon.filter(
        (value, index, self) =>
          index === self.findIndex(t => t.url === value.url),
      ),
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
        value: h.domain,
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
              h.hostname.value.startsWith('fe80::')) ||
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

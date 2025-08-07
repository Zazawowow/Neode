import { T } from '@start9labs/start-sdk'
import { ConfigService } from 'src/app/services/config.service'

export function getAddresses(
  serviceInterface: T.ServiceInterface,
  host: T.Host,
  config: ConfigService,
): MappedServiceInterface['addresses'] {
  const addressInfo = serviceInterface.addressInfo
  const hostnames =
    host.hostnameInfo[addressInfo.internalPort]?.filter(
      h =>
        config.isLocalhost() ||
        h.kind !== 'ip' ||
        h.hostname.kind !== 'ipv6' ||
        !h.hostname.value.startsWith('fe80::'),
    ) || []

  if (config.isLocalhost()) {
    const local = hostnames.find(
      h => h.kind === 'ip' && h.hostname.kind === 'local',
    )

    if (local) {
      hostnames.unshift({
        kind: 'ip',
        gatewayId: 'lo',
        public: false,
        hostname: {
          kind: 'local',
          port: local.hostname.port,
          sslPort: local.hostname.sslPort,
          value: 'localhost',
        },
      })
    }
  }

  const common: Address[] = [
    {
      type: 'Local',
      description: '',
      gateway: 'Wired Connection 1',
      url: 'https://test.local:1234',
    },
    {
      type: 'IPv4 (LAN)',
      description: '',
      gateway: 'Wired Connection 1',
      url: 'https://192.168.1.10.local:1234',
    },
  ]
  const uncommon: Address[] = [
    {
      type: 'IPv4 (WAN)',
      description: '',
      gateway: 'Wired Connection 1',
      url: 'https://72.72.72.72',
    },
  ]

  // hostnames.forEach(h => {
  //   const addresses = utils.addressHostToUrl(addressInfo, h)

  //   addresses.forEach(url => {
  //     if (h.kind === 'onion') {
  //       tor.push({
  //         protocol: /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)
  //           ? new URL(url).protocol.replace(':', '').toUpperCase()
  //           : null,
  //         url,
  //       })
  //     } else {
  //       const hostnameKind = h.hostname.kind

  //       if (
  //         h.public ||
  //         (hostnameKind === 'domain' && host.domains[h.hostname.domain]?.public)
  //       ) {
  //         clearnet.push({
  //           url,
  //           disabled: !h.public,
  //           isDomain: hostnameKind == 'domain',
  //           authority:
  //             hostnameKind == 'domain'
  //               ? host.domains[h.hostname.domain]?.acme || null
  //               : null,
  //         })
  //       } else {
  //         local.push({
  //           nid:
  //             hostnameKind === 'local'
  //               ? 'Local'
  //               : `${h.gatewayId} (${hostnameKind})`,
  //           url,
  //         })
  //       }
  //     }
  //   })
  // })

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

export type MappedServiceInterface = T.ServiceInterface & {
  gateways: InterfaceGateway[]
  torDomains: string[]
  clearnetDomains: ClearnetDomain[]
  addresses: {
    common: Address[]
    uncommon: Address[]
  }
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

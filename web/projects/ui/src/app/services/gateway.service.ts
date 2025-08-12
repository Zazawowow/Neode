import { inject, Injectable } from '@angular/core'
import { PatchDB } from 'patch-db-client'
import { T } from '@start9labs/start-sdk'
import { map } from 'rxjs/operators'
import { DataModel } from './patch-db/data-model'
import { toSignal } from '@angular/core/rxjs-interop'

export type GatewayPlus = T.NetworkInterfaceInfo & {
  id: string
  ipInfo: T.IpInfo
  lanIpv4: string[]
}

@Injectable()
export class GatewayService {
  readonly gateways = toSignal(
    inject<PatchDB<DataModel>>(PatchDB)
      .watch$('serverInfo', 'network', 'gateways')
      .pipe(
        map(gateways =>
          Object.entries(gateways)
            .filter(([_, val]) => !!val.ipInfo)
            .map(
              ([id, val]) =>
                ({
                  ...val,
                  id,
                  lanIpv4: val.ipInfo?.subnets
                    .filter(s => !s.includes('::'))
                    .map(s => s.split('/')[0]),
                }) as GatewayPlus,
            ),
        ),
      ),
  )
}

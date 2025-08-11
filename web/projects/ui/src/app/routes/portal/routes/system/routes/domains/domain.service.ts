import { inject, Injectable } from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nKey,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { toSignal } from '@angular/core/rxjs-interop'
import { ISB, T, utils } from '@start9labs/start-sdk'
import { filter, map } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { PatchDB } from 'patch-db-client'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { RR } from 'src/app/services/api/api.types'
import { DNS } from './dns.component'

// @TODO translations

export type MappedDomain = {
  fqdn: string
  gateway: {
    id: string
    name: string | null
    ipInfo: T.IpInfo | null
  }
}

type GatewayWithId = T.NetworkInterfaceInfo & {
  id: string
  ipInfo: T.IpInfo & {
    wanIp: string
  }
}

@Injectable()
export class DomainService {
  private readonly patch = inject<PatchDB<DataModel>>(PatchDB)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)
  private readonly i18n = inject(i18nPipe)
  private readonly dialog = inject(DialogService)

  readonly data = toSignal(
    this.patch.watch$('serverInfo', 'network').pipe(
      map(({ gateways, domains }) => ({
        gateways: Object.entries(gateways)
          .filter(([_, g]) => g.ipInfo && g.ipInfo.wanIp)
          .map(([id, g]) => ({ id, ...g })) as GatewayWithId[],
        domains: Object.entries(domains).map(
          ([fqdn, { gateway }]) =>
            ({
              fqdn,
              gateway: {
                id: gateway,
                ipInfo: gateways[gateway]?.ipInfo || null,
              },
            }) as MappedDomain,
        ),
      })),
    ),
  )

  async add() {
    const addSpec = ISB.InputSpec.of({
      fqdn: ISB.Value.text({
        name: 'Domain',
        description:
          'Enter a fully qualified domain name. For example, if you control domain.com, you could enter domain.com or subdomain.domain.com or another.subdomain.domain.com. In any case, the domain you enter and all possible subdomains of the domain will be available for assignment in StartOS',
        required: true,
        default: null,
        patterns: [utils.Patterns.domain],
      }),
      ...this.gatewaysSpec(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Add domain',
      data: {
        spec: await configBuilderToSpec(addSpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof addSpec._TYPE) =>
              this.save({
                fqdn: input.fqdn,
                gateway: input.gateway,
              }),
          },
        ],
      },
    })
  }

  async edit(domain: MappedDomain) {
    const editSpec = ISB.InputSpec.of({
      ...this.gatewaysSpec(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Edit domain',
      data: {
        spec: await configBuilderToSpec(editSpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof editSpec._TYPE) =>
              this.save({
                fqdn: domain.fqdn,
                gateway: input.gateway,
              }),
          },
        ],
        value: {
          gateway: domain.gateway.id,
        },
      },
    })
  }

  remove(fqdn: string) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
          await this.api.removeDomain({ fqdn })
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  showDns(domain: MappedDomain) {
    this.dialog
      .openComponent(DNS, { label: 'DNS Records' as i18nKey, data: domain })
      .subscribe()
  }

  private async save(params: RR.AddDomainReq) {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.addDomain(params)
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }

  private gatewaysSpec() {
    const gateways = this.data()?.gateways || []

    return {
      gateway: ISB.Value.dynamicSelect(() => ({
        name: 'Gateway',
        description: 'Select a gateway to use for this domain.',
        values: gateways.reduce<Record<string, string>>(
          (obj, gateway) => ({
            ...obj,
            [gateway.id]: gateway.ipInfo!.name,
          }),
          {},
        ),
        default: '',
        disabled: gateways
          .filter(g => g.ipInfo.wanIp.split('.').at(-1) === '100')
          .map(g => g.id),
      })),
    }
  }
}

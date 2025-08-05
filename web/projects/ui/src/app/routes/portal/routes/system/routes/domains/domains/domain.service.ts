import { inject, Injectable } from '@angular/core'
import {
  DialogService,
  ErrorService,
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
import { toAuthorityName } from 'src/app/utils/acme'
import { parse } from 'tldts'
import { RR } from 'src/app/services/api/api.types'
import { DNS } from './dns.component'

// @TODO translations

export type MappedDomain = {
  fqdn: string
  subdomain: string | null
  gateway: {
    id: string
    name: string | null
    ipInfo: T.IpInfo | null
  }
  authority: {
    url: string | null
    name: string | null
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
      map(({ networkInterfaces, domains, acme }) => ({
        gateways: Object.entries(networkInterfaces).reduce<
          Record<string, string>
        >(
          (obj, [id, n]) => ({
            ...obj,
            [id]: n.ipInfo?.name || '',
          }),
          {},
        ),
        domains: Object.entries(domains).map(
          ([fqdn, { gateway, acme }]) =>
            ({
              fqdn,
              subdomain: parse(fqdn).subdomain,
              gateway: {
                id: gateway,
                ipInfo: networkInterfaces[gateway]?.ipInfo || null,
              },
              authority: {
                url: acme,
                name: toAuthorityName(acme),
              },
            }) as MappedDomain,
        ),
        authorities: Object.keys(acme).reduce<Record<string, string>>(
          (obj, url) => ({
            ...obj,
            [url]: toAuthorityName(url),
          }),
          { local: toAuthorityName(null) },
        ),
      })),
    ),
  )

  async add() {
    const addSpec = ISB.InputSpec.of({
      fqdn: ISB.Value.text({
        name: 'Domain',
        description:
          'Enter a domain/subdomain. For example, if you control domain.com, you could enter domain.com or subdomain.domain.com or another.subdomain.domain.com. In any case, the domain you enter and all possible subdomains of the domain will be available for assignment in StartOS',
        required: true,
        default: null,
        patterns: [utils.Patterns.domain],
      }),
      ...this.gatewaysAndAuthorities(),
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
                acme: input.authority === 'local' ? null : input.authority,
              }),
          },
        ],
      },
    })
  }

  async edit(domain: MappedDomain) {
    const editSpec = ISB.InputSpec.of({
      ...this.gatewaysAndAuthorities(),
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
                acme: input.authority === 'local' ? null : input.authority,
              }),
          },
        ],
        value: {
          gateway: domain.gateway.id,
          authority: domain.authority.url || 'local',
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
      .openComponent(DNS, { label: 'Manage DNS', data: domain })
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

  private gatewaysAndAuthorities() {
    return {
      gateway: ISB.Value.select({
        name: 'Gateway',
        description:
          'Select the public gateway for this domain. Whichever gateway you select is the IP address that will be exposed to the Internet.',
        values: this.data()!.gateways,
        default: '',
      }),
      authority: ISB.Value.select({
        name: 'Default Certificate Authority',
        description:
          'Select the default certificate authority that will sign certificates for this domain. You can override this on a case-by-case basis.',
        values: this.data()!.authorities,
        default: '',
      }),
    }
  }
}

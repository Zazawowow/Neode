import { inject, Injectable } from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { toSignal } from '@angular/core/rxjs-interop'
import { ISB, utils } from '@start9labs/start-sdk'
import { filter, map } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { PatchDB } from 'patch-db-client'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { toAuthorityName } from 'src/app/utils/acme'

// @TODO translations

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
      map(network => {
        return {
          gateways: Object.entries(network.networkInterfaces).reduce<
            Record<string, string>
          >(
            (obj, [id, n]) => ({
              ...obj,
              [id]: n.ipInfo?.name || '',
            }),
            {},
          ),
          // @TODO use real data
          domains: [
            {
              domain: 'blog.mydomain.com',
              gateway: {
                id: 'wireguard1',
                name: 'StartTunnel',
              },
              authority: {
                url: 'https://acme-v02.api.letsencrypt.org/directory',
                name: `Let's Encrypt`,
              },
            },
            {
              domain: 'store.mydomain.com',
              gateway: {
                id: 'eth0',
                name: 'Ethernet',
              },
              authority: {
                url: 'local',
                name: toAuthorityName(null),
              },
            },
          ],
          authorities: Object.keys(network.acme).reduce<Record<string, string>>(
            (obj, url) => ({
              ...obj,
              [url]: toAuthorityName(url),
            }),
            { local: toAuthorityName(null) },
          ),
        }
      }),
    ),
  )

  async add() {
    const addSpec = ISB.InputSpec.of({
      domain: ISB.Value.text({
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
      label: 'Add Domain' as any,
      data: {
        spec: await configBuilderToSpec(addSpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof addSpec._TYPE) => this.save(input),
          },
        ],
      },
    })
  }

  async edit(domain: any) {
    const editSpec = ISB.InputSpec.of({
      ...this.gatewaysAndAuthorities(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Edit Domain',
      data: {
        spec: await configBuilderToSpec(editSpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof editSpec._TYPE) =>
              this.save({
                domain: domain.domain,
                ...input,
              }),
          },
        ],
        value: {
          gateway: domain.gateway.id,
          authority: domain.authority.url,
        },
      },
    })
  }

  remove(domain: any) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
          // @TODO API
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  showDns(domain: any) {
    // @TODO
  }

  testDns(domain: any) {
    // @TODO
  }

  // @TODO different endpoints for create and edit?
  private async save(params: any) {
    const loader = this.loader.open('Saving').subscribe()

    try {
      // @TODO API
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

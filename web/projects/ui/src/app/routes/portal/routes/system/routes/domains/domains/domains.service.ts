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
import { toAcmeName } from 'src/app/utils/acme'

// @TODO translations

@Injectable()
export class DomainsService {
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
                id: '',
                name: 'StartTunnel',
              },
              acme: {
                url: '',
                name: `Lert's Encrypt`,
              },
            },
            {
              domain: 'store.mydomain.com',
              gateway: {
                id: '',
                name: 'Ethernet',
              },
              acme: {
                url: null,
                name: 'System',
              },
            },
          ],
          acme: Object.keys(network.acme).reduce<Record<string, string>>(
            (obj, url) => ({
              ...obj,
              [url]: toAcmeName(url),
            }),
            { none: 'None (use system Root CA)' },
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
      ...this.gatewaysAndAcme(),
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
      ...this.gatewaysAndAcme(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Edit Domain' as any, // @TODO translation
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
          acme: domain.acme.url,
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

  private gatewaysAndAcme() {
    return {
      gateway: ISB.Value.select({
        name: 'Gateway',
        description:
          'Select the public gateway for this domain. Whichever gateway you select is the IP address that will be exposed to the Internet.',
        values: this.data()!.gateways,
        default: '',
      }),
      acme: ISB.Value.select({
        name: 'Default ACME',
        description:
          'Select the default ACME provider for this domain. This can be overridden on a case-by-case basis.',
        values: this.data()!.acme,
        default: '',
      }),
    }
  }
}

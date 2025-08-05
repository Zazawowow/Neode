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
import { PatchDB } from 'patch-db-client'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { knownAuthorities, toAuthorityName } from 'src/app/utils/acme'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

export type Authority = {
  url: string | null
  name: string
  contact: readonly string[] | null
}

export type RemoteAuthority = Authority & { url: string }

@Injectable()
export class AuthorityService {
  private readonly patch = inject<PatchDB<DataModel>>(PatchDB)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)
  private readonly i18n = inject(i18nPipe)
  private readonly dialog = inject(DialogService)

  readonly authorities = toSignal<Authority[]>(
    this.patch.watch$('serverInfo', 'network', 'acme').pipe(
      map(acme => [
        {
          url: null,
          name: toAuthorityName(null),
          contact: null,
        },
        ...Object.keys(acme).map(url => ({
          url,
          name: toAuthorityName(url),
          contact:
            acme[url]?.contact.map(mailto => mailto.replace('mailto:', '')) ||
            null,
        })),
      ]),
    ),
  )

  async add(authorities: Authority[]) {
    const availableAuthorities = knownAuthorities.filter(
      ca => !authorities.map(a => a.url).includes(ca.url),
    )

    const addSpec = ISB.InputSpec.of({
      provider: ISB.Value.union({
        name: 'Provider',
        default: (availableAuthorities[0]?.url as any) || 'other',
        variants: ISB.Variants.of({
          ...availableAuthorities.reduce(
            (obj, curr) => ({
              ...obj,
              [curr.url]: {
                name: curr.name,
                spec: ISB.InputSpec.of({}),
              },
            }),
            {},
          ),
          other: {
            name: 'Other',
            spec: ISB.InputSpec.of({
              url: ISB.Value.text({
                name: 'URL',
                default: null,
                required: true,
                inputmode: 'url',
                patterns: [utils.Patterns.url],
              }),
            }),
          },
        }),
      }),
      contact: this.emailListSpec(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Add Certificate Authority',
      data: {
        spec: await configBuilderToSpec(addSpec),
        buttons: [
          {
            text: this.i18n.transform('Save'),
            handler: async (val: typeof addSpec._TYPE) => {
              const providerUrl =
                val.provider.selection === 'other'
                  ? val.provider.value.url
                  : val.provider.selection

              return this.save(providerUrl, val.contact)
            },
          },
        ],
      },
    })
  }

  async edit({ url, contact }: RemoteAuthority) {
    const editSpec = ISB.InputSpec.of({
      contact: this.emailListSpec(),
    })

    this.formDialog.open(FormComponent, {
      label: 'Edit contact info',
      data: {
        spec: await configBuilderToSpec(editSpec),
        buttons: [
          {
            text: this.i18n.transform('Save'),
            handler: async (val: typeof editSpec._TYPE) =>
              this.save(url, val.contact),
          },
        ],
        value: { contact },
      },
    })
  }

  remove({ url }: RemoteAuthority) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Removing').subscribe()

        try {
          await this.api.removeAcme({ provider: url })
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  private async save(url: string, contact: readonly string[]) {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.initAcme({
        provider: new URL(url).href,
        contact: contact.map(address => `mailto:${address}`),
      })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }

  private emailListSpec() {
    return ISB.Value.list(
      ISB.List.text(
        {
          name: this.i18n.transform('Contact Emails')!,
          description: this.i18n.transform(
            'Needed to obtain a certificate from a Certificate Authority',
          ),
          minLength: 1,
        },
        {
          inputmode: 'email',
          patterns: [utils.Patterns.email],
        },
      ),
    )
  }
}

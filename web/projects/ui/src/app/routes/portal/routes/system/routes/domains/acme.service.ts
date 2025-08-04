import { inject, Injectable } from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { ISB, utils } from '@start9labs/start-sdk'
import { filter } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { knownACME } from 'src/app/utils/acme'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

@Injectable({
  providedIn: 'root',
})
export class AcmeService {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)
  private readonly i18n = inject(i18nPipe)
  private readonly dialog = inject(DialogService)

  async add(providers: { url: string; contact: string[] }[]) {
    this.formDialog.open(FormComponent, {
      label: 'Add ACME Provider',
      data: {
        spec: await configBuilderToSpec(
          this.addSpec(providers.map(p => p.url)),
        ),
        buttons: [
          {
            text: this.i18n.transform('Save'),
            handler: async (val: ReturnType<typeof this.addSpec>['_TYPE']) => {
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

  async edit({ url, contact }: { url: string; contact: readonly string[] }) {
    this.formDialog.open(FormComponent, {
      label: 'Edit ACME Provider',
      data: {
        spec: await configBuilderToSpec(this.editSpec()),
        buttons: [
          {
            text: this.i18n.transform('Save'),
            handler: async (val: ReturnType<typeof this.editSpec>['_TYPE']) =>
              this.save(url, val.contact),
          },
        ],
        value: { contact },
      },
    })
  }

  remove({ url }: { url: string }) {
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

  private async save(providerUrl: string, contact: readonly string[]) {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.initAcme({
        provider: new URL(providerUrl).href,
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

  private addSpec(providers: string[]) {
    const availableAcme = knownACME.filter(
      acme => !providers.includes(acme.url),
    )

    return ISB.InputSpec.of({
      provider: ISB.Value.union({
        name: 'Provider',
        default: (availableAcme[0]?.url as any) || 'other',
        variants: ISB.Variants.of({
          ...availableAcme.reduce(
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
  }

  private editSpec() {
    return ISB.InputSpec.of({
      contact: this.emailListSpec(),
    })
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

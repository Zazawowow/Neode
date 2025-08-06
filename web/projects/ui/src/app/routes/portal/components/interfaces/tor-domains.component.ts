import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import {
  DialogService,
  DocsLinkDirective,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { ISB, utils } from '@start9labs/start-sdk'
import { TuiAppearance, TuiButton, TuiLink } from '@taiga-ui/core'
import { filter } from 'rxjs'
import {
  FormComponent,
  FormContext,
} from 'src/app/routes/portal/components/form.component'
import { InterfaceComponent } from 'src/app/routes/portal/components/interfaces/interface.component'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

type OnionForm = {
  key: string
}

@Component({
  selector: 'section[torDomains]',
  template: `
    <header>
      <!-- @TODO translation -->
      Tor Domains
      <a
        tuiLink
        docsLink
        path="/user-manual/connecting-remotely/tor.html"
        appearance="action-grayscale"
        iconEnd="@tui.external-link"
        [pseudo]="true"
      ></a>
      <button
        tuiButton
        iconStart="@tui.plus"
        [style.margin-inline-start]="'auto'"
        (click)="add()"
      >
        {{ 'Add' | i18n }}
      </button>
    </header>
    @if (torDomains().length) {
      <table [appTable]="['Domain', null]">
        @for (domain of torDomains(); track $index) {
          <tr>
            <td>{{ domain }}</td>
            <td>
              <button
                tuiIconButton
                iconStart="@tui.trash"
                appearance="action-destructive"
                (click)="remove(domain)"
              >
                {{ 'Delete' | i18n }}
              </button>
            </td>
          </tr>
        }
      </table>
    } @else {
      <app-placeholder icon="@tui.app-window">
        {{ 'No Tor domains' | i18n }}
      </app-placeholder>
    }
  `,
  imports: [
    TuiButton,
    TuiLink,
    TuiAppearance,
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    DocsLinkDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceTorDomainsComponent {
  private readonly dialog = inject(DialogService)
  private readonly formDialog = inject(FormDialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly interface = inject(InterfaceComponent)
  private readonly i18n = inject(i18nPipe)

  readonly torDomains = input.required<readonly string[]>()

  async remove(domain: string) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Removing').subscribe()
        const params = { onion: domain }

        try {
          if (this.interface.packageId()) {
            await this.api.pkgRemoveOnion({
              ...params,
              package: this.interface.packageId(),
              host: this.interface.value().addressInfo.hostId,
            })
          } else {
            await this.api.serverRemoveOnion(params)
          }
          return true
        } catch (e: any) {
          this.errorService.handleError(e)
          return false
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async add() {
    this.formDialog.open<FormContext<OnionForm>>(FormComponent, {
      label: 'New Tor domain',
      data: {
        spec: await configBuilderToSpec(
          ISB.InputSpec.of({
            key: ISB.Value.text({
              name: this.i18n.transform('Private Key (optional)')!,
              description: this.i18n.transform(
                'Optionally provide a base64-encoded ed25519 private key for generating the Tor V3 (.onion) domain. If not provided, a random key will be generated.',
              ),
              required: false,
              default: null,
              patterns: [utils.Patterns.base64],
            }),
          }),
        ),
        buttons: [
          {
            text: this.i18n.transform('Save')!,
            handler: async value => this.save(value),
          },
        ],
      },
    })
  }

  private async save(form: OnionForm): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      let onion = form.key
        ? await this.api.addTorKey({ key: form.key })
        : await this.api.generateTorKey({})
      onion = `${onion}.onion`

      if (this.interface.packageId) {
        await this.api.pkgAddOnion({
          onion,
          package: this.interface.packageId(),
          host: this.interface.value().addressInfo.hostId,
        })
      } else {
        await this.api.serverAddOnion({ onion })
      }
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }
}

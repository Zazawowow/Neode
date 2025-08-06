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
import {
  TuiAppearance,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiLink,
} from '@taiga-ui/core'
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
import { ClearnetDomain } from './interface.utils'

@Component({
  selector: 'section[clearnetDomains]',
  template: `
    <header>
      {{ 'Clearnet Domains' | i18n }}
      <a
        tuiLink
        docsLink
        path="/user-manual/connecting-remotely/clearnet.html"
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
    @if (clearnetDomains().length) {
      <table [appTable]="['Domain', 'Certificate Authority', 'Type', null]">
        @for (domain of clearnetDomains(); track $index) {
          <tr>
            <td>{{ domain.fqdn }}</td>
            <td>{{ domain.authority }}</td>
            <td>{{ domain.public ? 'public' : 'private' }}</td>
            <td>
              <button
                tuiIconButton
                tuiDropdown
                size="s"
                appearance="flat-grayscale"
                iconStart="@tui.ellipsis-vertical"
                [tuiAppearanceState]="open ? 'hover' : null"
                [(tuiDropdownOpen)]="open"
              >
                {{ 'More' | i18n }}
                <tui-data-list size="s" *tuiTextfieldDropdown>
                  <tui-opt-group>
                    <button
                      tuiOption
                      new
                      iconStart="@tui.pencil"
                      (click)="edit(domain)"
                    >
                      {{ 'Edit' | i18n }}
                    </button>
                  </tui-opt-group>
                  <tui-opt-group>
                    <button
                      tuiOption
                      new
                      iconStart="@tui.trash"
                      class="g-negative"
                      (click)="remove(domain.fqdn)"
                    >
                      {{ 'Delete' | i18n }}
                    </button>
                  </tui-opt-group>
                </tui-data-list>
              </button>
            </td>
          </tr>
        }
      </table>
    } @else {
      <app-placeholder icon="@tui.app-window">
        {{ 'No clearnet domains' | i18n }}
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
    TuiDropdown,
    TuiDataList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceClearnetDomainsComponent {
  private readonly dialog = inject(DialogService)
  private readonly formDialog = inject(FormDialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly interface = inject(InterfaceComponent)
  private readonly i18n = inject(i18nPipe)

  readonly clearnetDomains = input.required<readonly ClearnetDomain[]>()

  open = false

  async add() {}

  async edit(domain: ClearnetDomain) {}

  async remove(fqdn: string) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Removing').subscribe()
        const params = { fqdn }

        try {
          if (this.interface.packageId()) {
            await this.api.pkgRemoveDomain({
              ...params,
              package: this.interface.packageId(),
              host: this.interface.value().addressInfo.hostId,
            })
          } else {
            await this.api.osUiRemoveDomain(params)
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
}

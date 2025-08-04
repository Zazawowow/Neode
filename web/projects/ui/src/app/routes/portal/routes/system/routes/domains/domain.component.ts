import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { ISB } from '@start9labs/start-sdk'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiTextfield,
} from '@taiga-ui/core'
import { filter } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

@Component({
  selector: 'tr[domain]',
  template: `
    <td>{{ domain().domain }}</td>
    <td [style.order]="-1">{{ domain().gateway }}</td>
    <td>{{ domain().acme }}</td>
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
            <button tuiOption new iconStart="@tui.pencil" (click)="edit()">
              {{ 'Edit' | i18n }}
            </button>
            <button tuiOption new iconStart="@tui.shield" (click)="showDns()">
              {{ 'Show DNS' | i18n }}
            </button>
            <button tuiOption new iconStart="@tui.shield" (click)="testDns()">
              {{ 'Test DNS' | i18n }}
            </button>
          </tui-opt-group>
          <tui-opt-group>
            <button
              tuiOption
              new
              iconStart="@tui.trash"
              class="g-negative"
              (click)="remove()"
            >
              {{ 'Delete' | i18n }}
            </button>
          </tui-opt-group>
        </tui-data-list>
      </button>
    </td>
  `,
  styles: `
    td:last-child {
      grid-area: 1 / 2 / 4;
      align-self: center;
      text-align: right;
    }

    :host-context(tui-root._mobile) {
      grid-template-columns: 1fr min-content;

      td:first-child {
        font: var(--tui-font-text-m);
        font-weight: bold;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, i18nPipe, TuiDropdown, TuiDataList, TuiTextfield],
})
export class DomainsDomainComponent {
  private readonly dialog = inject(DialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly formDialog = inject(FormDialogService)

  readonly domain = input.required<any>()

  open = false

  remove() {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async edit() {
    const renameSpec = ISB.InputSpec.of({})

    this.formDialog.open(FormComponent, {
      label: 'Edit',
      data: {
        spec: await configBuilderToSpec(renameSpec),
        buttons: [
          {
            text: 'Save',
            handler: (value: typeof renameSpec._TYPE) => {},
          },
        ],
      },
    })
  }

  async showDns() {}

  async testDns() {}
}

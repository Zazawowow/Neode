import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiTextfield,
} from '@taiga-ui/core'
import { DomainsService } from './domains.service'

@Component({
  selector: 'tr[domain]',
  template: `
    <td>{{ domain().domain }}</td>
    <td [style.order]="-1">{{ domain().gateway.name }}</td>
    <td>{{ domain().acme.name }}</td>
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
              (click)="domainsService.edit(domain())"
            >
              {{ 'Edit' | i18n }}
            </button>
            <button
              tuiOption
              new
              iconStart="@tui.shield"
              (click)="domainsService.showDns(domain())"
            >
              {{ 'Show DNS' | i18n }}
            </button>
            <button
              tuiOption
              new
              iconStart="@tui.shield"
              (click)="domainsService.testDns(domain())"
            >
              {{ 'Test DNS' | i18n }}
            </button>
          </tui-opt-group>
          <tui-opt-group>
            <button
              tuiOption
              new
              iconStart="@tui.trash"
              class="g-negative"
              (click)="domainsService.remove(domain())"
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
export class DomainsItemComponent {
  protected readonly domainsService = inject(DomainsService)

  readonly domain = input.required<any>()

  open = false
}

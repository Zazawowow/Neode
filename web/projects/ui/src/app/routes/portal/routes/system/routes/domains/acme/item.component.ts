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
import { ACMEInfo, AcmeService } from './acme.service'

@Component({
  selector: 'tr[acme]',
  template: `
    <td>{{ acme().name }}</td>
    <td>{{ acme().contact.join(', ') }}</td>
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
              (click)="service.edit(acme())"
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
              (click)="service.remove(acme())"
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
      grid-area: 1 / 2 / 3;
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
export class AcmeItemComponent {
  protected readonly service = inject(AcmeService)

  readonly acme = input.required<ACMEInfo>()

  open = false
}

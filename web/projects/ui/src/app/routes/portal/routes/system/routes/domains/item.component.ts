import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiOptGroup,
} from '@taiga-ui/core'

@Component({
  selector: 'tr[domain]',
  template: `
    <td></td>
    <td></td>
    <td></td>
    <td>
      <button
        tuiIconButton
        iconStart="@tui.ellipsis"
        appearance="icon"
        [tuiDropdown]="content"
        [(tuiDropdownOpen)]="open"
        [tuiDropdownMaxHeight]="9999"
      ></button>
      <ng-template #content>
        <tui-data-list [style.width.rem]="13">
          <tui-opt-group>
            <button
              tuiOption
              iconStart="@tui.pencil"
              (click)="onEdit.emit(domain())"
            >
              Edit
            </button>
            <button
              tuiOption
              iconStart="@tui.shield"
              (click)="onShowDns.emit(domain())"
            >
              Show DNS
            </button>
            <button
              tuiOption
              iconStart="@tui.shield"
              (click)="onTestDns.emit(domain())"
            >
              Test DNS
            </button>
            <button
              tuiOption
              appearance="negative"
              iconStart="@tui.trash-2"
              (click)="onRemove.emit(domain())"
            >
              {{ 'Delete' | i18n }}
            </button>
          </tui-opt-group>
        </tui-data-list>
      </ng-template>
    </td>
  `,
  styles: `
    td:last-child {
      grid-area: 3 / span 4;
      white-space: nowrap;
      text-align: right;
      flex-direction: row-reverse;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    :host-context(tui-root._mobile) {
      display: grid;
      grid-template-columns: repeat(3, min-content) 1fr;
      align-items: center;
      padding: 1rem 0.5rem;
      gap: 0.5rem;

      td {
        display: flex;
        padding: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, i18nPipe, TuiDropdown, TuiDataList, TuiOptGroup],
})
export class DomainsItemComponent {
  readonly domain = input.required<any>()

  onEdit = output<any>()
  onShowDns = output<any>()
  onTestDns = output<any>()
  onRemove = output<any>()

  open = false
}

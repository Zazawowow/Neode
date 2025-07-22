import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { T } from '@start9labs/start-sdk'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiOptGroup,
} from '@taiga-ui/core'

export type WireguardProxy = T.NetworkInterfaceInfo & {
  id: string
  ipInfo: WireguardIpInfo
}

export type WireguardIpInfo = T.IpInfo & {
  deviceType: 'wireguard'
}

@Component({
  selector: 'tr[proxy]',
  template: `
    <td class="label">{{ proxy().ipInfo.name }}</td>
    <td class="type">
      {{ proxy().public ? ('Public' | i18n) : ('Private' | i18n) }}
    </td>
    <td class="actions">
      <button
        tuiIconButton
        iconStart="@tui.ellipsis"
        appearance="icon"
        [tuiDropdown]="content"
        [(tuiDropdownOpen)]="open"
        [tuiDropdownMaxHeight]="9999"
      >
        <img [style.max-width.%]="60" src="assets/img/icon.png" alt="StartOS" />
      </button>
      <ng-template #content>
        <tui-data-list [style.width.rem]="13">
          <tui-opt-group>
            <button
              tuiOption
              iconStart="@tui.pencil"
              (click)="onRename.emit(proxy())"
            >
              {{ 'Rename' | i18n }}
            </button>
            <button
              tuiOption
              appearance="negative"
              iconStart="@tui.trash-2"
              (click)="onRemove.emit(proxy())"
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
export class ProxiesItemComponent {
  readonly proxy = input.required<WireguardProxy>()

  onRename = output<WireguardProxy>()
  onRemove = output<WireguardProxy>()

  open = false
}

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

export type GatewayWithID = T.NetworkInterfaceInfo & {
  id: string
  ipInfo: T.IpInfo
}

@Component({
  selector: 'tr[proxy]',
  template: `
    <td>{{ proxy().ipInfo.name }}</td>
    <td>{{ proxy().ipInfo.deviceType || '-' }}</td>
    <td>
      {{ proxy().public ? ('Public' | i18n) : ('Private' | i18n) }}
    </td>
    <!-- // @TODO show both LAN IPs? -->
    <td>{{ proxy().ipInfo.subnets[0] }}</td>
    <td>{{ proxy().ipInfo.wanIp }}</td>
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
              (click)="onRename.emit(proxy())"
            >
              {{ 'Rename' | i18n }}
            </button>
            @if (proxy().ipInfo.deviceType === 'wireguard') {
              <button
                tuiOption
                appearance="negative"
                iconStart="@tui.trash-2"
                (click)="onRemove.emit(proxy())"
              >
                {{ 'Delete' | i18n }}
              </button>
            }
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
export class GatewaysItemComponent {
  readonly proxy = input.required<GatewayWithID>()

  onRename = output<GatewayWithID>()
  onRemove = output<GatewayWithID>()

  open = false
}

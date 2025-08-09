import {
  ChangeDetectionStrategy,
  Component,
  input,
  inject,
} from '@angular/core'
import { DialogService, i18nKey, i18nPipe } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { DisplayAddress } from '../interface.service'
import { AddressActionsComponent } from './actions.component'

@Component({
  selector: 'tr[address]',
  template: `
    @if (address(); as address) {
      <td [style.width.rem]="3">
        <button
          tuiIconButton
          appearance="flat-grayscale"
          iconStart="@tui.eye"
          (click)="viewDetails(address.bullets)"
        >
          {{ 'Address details' | i18n }}
        </button>
      </td>
      <td [style.width.rem]="6">{{ address.type }}</td>
      <td [style.width.rem]="10" [style.order]="-1">
        {{ address.gatewayName || '-' }}
      </td>
      <td>{{ address.url }}</td>
      <td
        actions
        [disabled]="!isRunning()"
        [href]="address.url"
        [style.width.rem]="7"
        (onDetails)="viewDetails(address.bullets)"
      ></td>
    }
  `,
  styles: `
    :host-context(tui-root._mobile) {
      td {
        width: auto !important;
      }

      td:first-child {
        display: none;
      }

      td:nth-child(2) {
        font: var(--tui-font-text-m);
        font-weight: bold;
        color: var(--tui-text-primary);
      }
    }
  `,
  imports: [i18nPipe, AddressActionsComponent, TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceAddressItemComponent {
  readonly address = input.required<DisplayAddress>()
  readonly isRunning = input.required<boolean>()
  readonly dialog = inject(DialogService)

  viewDetails(bullets: string[]) {
    this.dialog
      .openAlert(
        `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` as i18nKey,
        {
          label: 'About this address' as i18nKey,
        },
      )
      .subscribe()
  }
}

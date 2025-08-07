import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { TuiAccordion } from '@taiga-ui/experimental'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { MappedServiceInterface } from '../interface.utils'
import { AddressActionsComponent } from './actions.component'

@Component({
  selector: 'section[addresses]',
  template: `
    <header>{{ 'Addresses' | i18n }}</header>
    <table [appTable]="[null, 'Type', 'Gateway', 'URL', null]">
      @for (address of addresses().common; track $index) {
        <tr>
          <td>
            <button
              tuiIconButton
              appearance="flat-grayscale"
              iconStart="@tui.eye"
              (click)="instructions()"
            >
              {{ 'View instructions' | i18n }}
            </button>
          </td>
          <td>{{ address.type }}</td>
          <td [style.order]="-1">{{ address.gateway }}</td>
          <td>{{ address.url }}</td>
          <td actions [disabled]="!isRunning()" [href]="address.url"></td>
        </tr>
      } @empty {
        <tr>
          <td colspan="5">
            <app-placeholder icon="@tui.list-x">
              {{ 'No addresses' | i18n }}
            </app-placeholder>
          </td>
        </tr>
      }
    </table>

    @if (addresses().uncommon.length) {
      <tui-accordion>
        <button tuiAccordion>{{ 'Uncommon' | i18n }}</button>
        <tui-expand>
          <table [appTable]="[null, 'Type', 'Gateway', 'URL', null]">
            @for (address of addresses().uncommon; track $index) {
              <tr>
                <td>
                  <button
                    tuiIconButton
                    appearance="flat-grayscale"
                    iconStart="@tui.eye"
                    (click)="instructions()"
                  >
                    {{ 'View instructions' | i18n }}
                  </button>
                </td>
                <td>{{ address.type }}</td>
                <td [style.order]="-1">{{ address.gateway }}</td>
                <td>{{ address.url }}</td>
                <td actions [disabled]="!isRunning()" [href]="address.url"></td>
              </tr>
            }
          </table>
        </tui-expand>
      </tui-accordion>
    }
  `,
  styles: `
    [tuiAccordion],
    tui-expand {
      box-shadow: none;
      padding: 0;
      background: none !important;

      &::after {
        margin-inline-end: 0.25rem;
      }
    }

    :host-context(tui-root._mobile) {
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
  host: { class: 'g-card' },
  imports: [
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    AddressActionsComponent,
    TuiButton,
    TuiAccordion,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceAddressesComponent {
  readonly addresses = input.required<MappedServiceInterface['addresses']>()
  readonly isRunning = input.required<boolean>()

  instructions() {}
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { TuiAccordion } from '@taiga-ui/experimental'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { MappedServiceInterface } from '../interface.service'
import { InterfaceAddressItemComponent } from './item.component'

@Component({
  selector: 'section[addresses]',
  template: `
    <header>{{ 'Addresses' | i18n }}</header>
    <table [appTable]="[null, 'Type', 'Gateway', 'URL', null]">
      @for (
        address of addresses().common.concat(addresses().uncommon);
        track $index
      ) {
        <tr [address]="address" [isRunning]="isRunning()"></tr>
      } @empty {
        <tr>
          <td colspan="5">
            <app-placeholder icon="@tui.list-x">
              {{ 'No addresses' | i18n }}
            </app-placeholder>
          </td>
        </tr>
      }
      <!-- @if (addresses().uncommon.length) {
        <tui-accordion>
          <button tuiAccordion>{{ 'Uncommon' | i18n }}</button>
          <tui-expand>
            @for (address of addresses().uncommon; track $index) {
              <tr [address]="address" [isRunning]="isRunning()"></tr>
            }
          </tui-expand>
        </tui-accordion>
      } -->
    </table>
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
  `,
  host: { class: 'g-card' },
  imports: [
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    InterfaceAddressItemComponent,
    TuiButton,
    TuiAccordion,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceAddressesComponent {
  readonly addresses = input.required<MappedServiceInterface['addresses']>()
  readonly isRunning = input.required<boolean>()
}

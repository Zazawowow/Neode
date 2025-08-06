import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiButton, TuiDataList, TuiDropdown } from '@taiga-ui/core'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { MappedServiceInterface } from '../interface.utils'
import { AddressActionsComponent } from './actions.component'

@Component({
  selector: 'section[addresses]',
  template: `
    <header>{{ 'Addresses' | i18n }}</header>
    @if (addresses().common.length) {
      <section class="g-card">
        <header>{{ 'Common' | i18n }}</header>
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
              <td>{{ address.gateway }}</td>
              <td>{{ address.url }}</td>
              <td actions [disabled]="!isRunning()" [href]="address.url"></td>
            </tr>
          }
        </table>
      </section>
    } @else {
      <app-placeholder icon="@tui.app-window">
        {{ 'No addresses' | i18n }}
      </app-placeholder>
    }

    @if (addresses().uncommon.length) {
      <section class="g-card">
        <header>{{ 'Uncommon' | i18n }}</header>
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
              <td>{{ address.gateway }}</td>
              <td>{{ address.url }}</td>
              <td actions [disabled]="!isRunning()" [href]="address.url"></td>
            </tr>
          }
        </table>
      </section>
    }
  `,
  imports: [
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    TuiDropdown,
    TuiDataList,
    AddressActionsComponent,
    TuiButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceAddressesComponent {
  readonly addresses = input.required<MappedServiceInterface['addresses']>()
  readonly isRunning = input.required<boolean>()

  instructions() {}
}

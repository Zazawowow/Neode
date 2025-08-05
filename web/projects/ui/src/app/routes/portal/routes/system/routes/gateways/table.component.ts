import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { GatewaysItemComponent, GatewayWithID } from './item.component'

@Component({
  selector: '[gateways]',
  template: `
    <table
      [appTable]="[
        'Name',
        'Type',
        'Access',
        $any('LAN IPs'),
        $any('WAN IP'),
        null,
      ]"
    >
      @for (proxy of gateways(); track $index) {
        <tr [proxy]="proxy"></tr>
      } @empty {
        <tr>
          <td colspan="5">
            @if (gateways()) {
              <app-placeholder icon="@tui.door-closed-locked">
                <!-- @TODO Matt finalize text and add translations -->
                No gateways
              </app-placeholder>
            } @else {
              <div [tuiSkeleton]="true">{{ 'Loading' | i18n }}</div>
            }
          </td>
        </tr>
      }
    </table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiSkeleton,
    i18nPipe,
    TableComponent,
    GatewaysItemComponent,
    PlaceholderComponent,
  ],
})
export class GatewaysTableComponent<T extends GatewayWithID> {
  readonly gateways = input<readonly T[] | null>(null)
}

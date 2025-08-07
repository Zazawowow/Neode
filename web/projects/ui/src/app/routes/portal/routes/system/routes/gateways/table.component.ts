import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { GatewaysItemComponent, GatewayPlus } from './item.component'

@Component({
  selector: '[gateways]',
  template: `
    <table
      [appTable]="[
        'Name',
        'Type',
        'Access',
        $any('LAN IP'),
        $any('WAN IP'),
        null,
      ]"
    >
      @for (gateway of gateways(); track $index) {
        <tr [gateway]="gateway"></tr>
      } @empty {
        <tr>
          <td colspan="5">
            <div [tuiSkeleton]="true">{{ 'Loading' | i18n }}</div>
          </td>
        </tr>
      }
    </table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiSkeleton, i18nPipe, TableComponent, GatewaysItemComponent],
})
export class GatewaysTableComponent<T extends GatewayPlus> {
  readonly gateways = input<readonly T[] | null>(null)
}

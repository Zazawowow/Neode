import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { DomainsItemComponent } from './item.component'

@Component({
  selector: 'domains-table',
  template: `
    <table [appTable]="['Domain', 'Gateway', 'Default ACME', null]">
      @for (domain of domains(); track $index) {
        <tr [domain]="domain"></tr>
      } @empty {
        <tr>
          <td [attr.colspan]="4">
            @if (domains()) {
              <app-placeholder icon="@tui.globe">
                {{ 'No domains' | i18n }}
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
    PlaceholderComponent,
    DomainsItemComponent,
  ],
})
export class DomainsTableComponent {
  // @TODO Alex proper types
  readonly domains = input<readonly any[] | null>()
}

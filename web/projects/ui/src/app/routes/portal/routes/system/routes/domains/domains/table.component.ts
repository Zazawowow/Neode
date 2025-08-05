import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { DomainItemComponent } from './item.component'
import { DomainService } from './domain.service'

@Component({
  selector: 'domains-table',
  template: `
    <table
      [appTable]="['Domain', 'Gateway', 'Default Certificate Authority', null]"
    >
      @for (domain of domainService.data()?.domains; track $index) {
        <tr [domain]="domain"></tr>
      } @empty {
        <tr>
          <td [attr.colspan]="4">
            @if (domainService.data()?.domains) {
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
    DomainItemComponent,
  ],
})
export class DomainsTableComponent {
  protected readonly domainService = inject(DomainService)
}

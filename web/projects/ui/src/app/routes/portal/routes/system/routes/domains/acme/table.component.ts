import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { AcmeItemComponent } from './item.component'
import { ACMEInfo } from './acme.service'

@Component({
  selector: 'acme-table',
  template: `
    <table [appTable]="['Provider', 'Contact', null]">
      @for (acme of acmes(); track $index) {
        <tr [acme]="acme"></tr>
      } @empty {
        <tr>
          <td [attr.colspan]="3">
            @if (acmes()) {
              <app-placeholder icon="@tui.shield-question">
                {{ 'No saved providers' | i18n }}
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
    AcmeItemComponent,
  ],
})
export class AcmeTableComponent {
  readonly acmes = input<ACMEInfo[]>()
}

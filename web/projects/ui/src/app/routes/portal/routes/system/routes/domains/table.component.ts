import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'

import { DomainsAcmeComponent } from './acme.component'
import { DomainsDomainComponent } from './domain.component'

@Component({
  selector: 'domains-table',
  template: `
    <table [appTable]="titles()">
      @for (item of items(); track $index) {
        @if (mode() === 'domains') {
          <tr [domain]="item"></tr>
        } @else if (mode() === 'acme') {
          <tr [acme]="item"></tr>
        }
      } @empty {
        <tr>
          <td [attr.colspan]="titles().length">
            @if (items()) {
              <app-placeholder icon="@tui.globe">
                @if (mode() === 'domains') {
                  {{ 'No domains' | i18n }}
                } @else {
                  {{ 'No saved providers' | i18n }}
                }
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
    DomainsDomainComponent,
    DomainsAcmeComponent,
  ],
})
export class DomainsTableComponent {
  // @TODO Alex proper types
  readonly items = input<readonly any[] | null>()
  readonly mode = input<'domains' | 'acme'>('domains')

  readonly titles = computed(() =>
    this.mode() === 'domains'
      ? (['Domain', 'Gateway', 'Default ACME', null] as const)
      : (['Provider', 'Contact', null] as const),
  )

  readonly icon = computed(() =>
    this.mode() === 'domains' ? '@tui.globe' : '@tui.shield-question',
  )
}

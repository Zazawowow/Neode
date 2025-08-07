import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'

import { DomainComponent } from './domain.component'
import { ClearnetDomain } from './interface.utils'

@Component({
  selector: 'section[clearnetDomains]',
  template: `
    <header>
      {{ 'Clearnet Domains' | i18n }}
      <a
        tuiIconButton
        docsLink
        path="/user-manual/connecting-remotely/clearnet.html"
        appearance="icon"
        iconStart="@tui.external-link"
      >
        {{ 'Documentation' | i18n }}
      </a>
      <button
        tuiButton
        iconStart="@tui.plus"
        [style.margin-inline-start]="'auto'"
        (click)="add()"
      >
        {{ 'Add' | i18n }}
      </button>
    </header>
    <table [appTable]="['Domain', 'Certificate Authority', 'Type', null]">
      @for (domain of clearnetDomains(); track $index) {
        <tr [domain]="domain"></tr>
      } @empty {
        <tr>
          <td colspan="4">
            <app-placeholder icon="@tui.app-window">
              {{ 'No clearnet domains' | i18n }}
            </app-placeholder>
          </td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      grid-column: span 3;
    }
  `,
  host: { class: 'g-card' },
  imports: [
    TuiButton,
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    DocsLinkDirective,
    DomainComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceClearnetDomainsComponent {
  readonly clearnetDomains = input.required<readonly ClearnetDomain[]>()

  open = false

  add() {}
}

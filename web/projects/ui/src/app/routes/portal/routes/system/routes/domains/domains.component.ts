import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { TitleDirective } from 'src/app/services/title.service'
import { DomainService } from './domain.service'
import { DomainsTableComponent } from './table.component'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Domains' | i18n }}
    </ng-container>

    <section class="g-card">
      <header>
        {{ 'Domains' | i18n }}
        <a
          tuiIconButton
          size="xs"
          docsLink
          path="/user-manual/domains.html"
          appearance="icon"
          iconStart="@tui.external-link"
        >
          {{ 'Documentation' | i18n }}
        </a>
        @if (domainService.data(); as value) {
          <button
            tuiButton
            size="xs"
            iconStart="@tui.plus"
            [style.margin-inline-start]="'auto'"
            (click)="domainService.add()"
          >
            Add
          </button>
        }
      </header>
      <domains-table />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiButton,
    RouterLink,
    TitleDirective,
    i18nPipe,
    DocsLinkDirective,
    DomainsTableComponent,
  ],
  providers: [DomainService],
})
export default class SystemDomainsComponent {
  protected readonly domainService = inject(DomainService)
}

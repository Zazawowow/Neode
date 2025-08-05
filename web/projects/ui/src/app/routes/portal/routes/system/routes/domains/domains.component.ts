import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton, TuiLink, TuiTitle } from '@taiga-ui/core'
import { TuiHeader } from '@taiga-ui/layout'
import { TitleDirective } from 'src/app/services/title.service'
import { AuthorityService } from './authorities/authority.service'
import { DomainService } from './domains/domain.service'
import { DomainsTableComponent } from './domains/table.component'
import { AuthoritiesTableComponent } from './authorities/table.component'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Domains' | i18n }}
    </ng-container>
    <header tuiHeader>
      <hgroup tuiTitle>
        <h3>{{ 'Domains' | i18n }}</h3>
        <p tuiSubtitle>
          {{
            'Adding a domain to StartOS means you can use it and its subdomains to host service interfaces on the public Internet.'
              | i18n
          }}
          <a
            tuiLink
            docsLink
            path="/user-manual/domains.html"
            appearance="action-grayscale"
            iconEnd="@tui.external-link"
            [pseudo]="true"
            [textContent]="'View instructions' | i18n"
          ></a>
        </p>
      </hgroup>
    </header>

    <section class="g-card">
      <header>
        {{ 'Certificate Authorities' | i18n }}
        @if (authorityService.authorities(); as authorities) {
          <button
            tuiButton
            size="xs"
            iconStart="@tui.plus"
            [style.margin-inline-start]="'auto'"
            (click)="authorityService.add(authorities)"
          >
            {{ 'Add' | i18n }}
          </button>
        }
      </header>
      <authorities-table />
    </section>

    <section class="g-card">
      <header>
        {{ 'Domains' | i18n }}
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
    TuiTitle,
    TuiHeader,
    TuiLink,
    RouterLink,
    TitleDirective,
    i18nPipe,
    DocsLinkDirective,
    DomainsTableComponent,
    AuthoritiesTableComponent,
  ],
  providers: [AuthorityService, DomainService],
})
export default class SystemDomainsComponent {
  protected readonly authorityService = inject(AuthorityService)
  protected readonly domainService = inject(DomainService)
}

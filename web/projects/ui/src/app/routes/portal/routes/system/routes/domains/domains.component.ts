import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton, TuiLink, TuiTitle } from '@taiga-ui/core'
import { TuiHeader } from '@taiga-ui/layout'
import { TitleDirective } from 'src/app/services/title.service'
import { AcmeService } from './acme/acme.service'
import { DomainsService } from './domains/domains.service'
import { DomainsTableComponent } from './domains/table.component'
import { AcmeTableComponent } from './acme/table.component'

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
          <!-- @TODO translation -->
          {{
            'Adding a domain to StartOS means you can use it and its subdomains to host service interfaces on the public Internet.'
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
        {{ 'ACME Providers' | i18n }}
        @if (acmeService.acmes(); as acmes) {
          <button
            tuiButton
            size="xs"
            iconStart="@tui.plus"
            [style.margin-inline-start]="'auto'"
            (click)="acmeService.add(acmes)"
          >
            {{ 'Add' | i18n }}
          </button>
        }
      </header>
      <acme-table [acmes]="acmeService.acmes()" />
    </section>

    <section class="g-card">
      <header>
        {{ 'Domains' | i18n }}
        @if (domainsService.data(); as value) {
          <button
            tuiButton
            size="xs"
            iconStart="@tui.plus"
            [style.margin-inline-start]="'auto'"
            (click)="domainsService.add()"
          >
            Add
          </button>
        }
      </header>
      <domains-table [domains]="domainsService.data()?.domains" />
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
    AcmeTableComponent,
  ],
  providers: [AcmeService, DomainsService],
})
export default class SystemDomainsComponent {
  protected readonly acmeService = inject(AcmeService)
  protected readonly domainsService = inject(DomainsService)
}

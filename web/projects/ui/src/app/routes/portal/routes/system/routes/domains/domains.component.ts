import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton, TuiLink, TuiTitle } from '@taiga-ui/core'
import { TuiHeader } from '@taiga-ui/layout'
import { PatchDB } from 'patch-db-client'
import { map } from 'rxjs'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { TitleDirective } from 'src/app/services/title.service'

import { AcmeService } from './acme.service'
import { DomainsTableComponent } from './table.component'

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
            'Add ACME providers in order to generate SSL (https) certificates for clearnet access.'
              | i18n
          }}
          <a
            tuiLink
            docsLink
            path="/user-manual/connecting-remotely/clearnet.html"
            fragment="#adding-acme"
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
        @if (acme(); as value) {
          <button
            tuiButton
            size="xs"
            iconStart="@tui.plus"
            [style.margin-inline-start]="'auto'"
            (click)="service.add(value)"
          >
            {{ 'Add' | i18n }}
          </button>
        }
      </header>
      <domains-table mode="acme" [items]="acme()" />
    </section>

    <section class="g-card">
      <header>
        {{ 'Domains' | i18n }}
        <button
          tuiButton
          size="xs"
          iconStart="@tui.plus"
          [style.margin-inline-start]="'auto'"
          (click)="addDomain()"
        >
          Add
        </button>
      </header>
      <domains-table mode="domains" [items]="domains()" />
    </section>
  `,
  styles: ``,
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
  ],
})
export default class SystemDomainsComponent {
  protected readonly patch = inject<PatchDB<DataModel>>(PatchDB)
  protected readonly service = inject(AcmeService)

  readonly acme = toSignal(
    this.patch.watch$('serverInfo', 'network', 'acme').pipe(
      map(acme =>
        Object.keys(acme).map(url => ({
          url,
          contact:
            acme[url]?.contact.map(mailto => mailto.replace('mailto:', '')) ||
            [],
        })),
      ),
    ),
  )

  readonly domains = signal([
    {
      domain: 'blog.mydomain.com',
      gateway: 'StartTunnel',
      acme: 'System',
    },
    {
      domain: 'blog. mydomain.com',
      gateway: 'StartTunnel',
      acme: 'System',
    },
  ])

  async addDomain() {}
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { DocsLinkDirective, i18nPipe } from '@start9labs/shared'
import { TuiButton, TuiLink } from '@taiga-ui/core'
import { TitleDirective } from 'src/app/services/title.service'
import { AuthorityService } from './authority.service'
import { AuthoritiesTableComponent } from './table.component'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Certificate Authorities' | i18n }}
    </ng-container>
    <section class="g-card">
      <header>
        {{ 'Certificate Authorities' | i18n }}
        <a
          tuiLink
          docsLink
          path="/user-manual/authorities.html"
          appearance="action-grayscale"
          iconEnd="@tui.external-link"
          [pseudo]="true"
        ></a>
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiButton,
    TuiLink,
    RouterLink,
    TitleDirective,
    i18nPipe,
    DocsLinkDirective,
    AuthoritiesTableComponent,
  ],
  providers: [AuthorityService],
})
export default class SystemAuthoritiesComponent {
  protected readonly authorityService = inject(AuthorityService)
}

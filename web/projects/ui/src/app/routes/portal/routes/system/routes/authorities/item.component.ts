import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import { i18nPipe } from '@start9labs/shared'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiTextfield,
} from '@taiga-ui/core'
import { Authority, AuthorityService } from './authority.service'

@Component({
  selector: 'tr[authority]',
  template: `
    @if (authority(); as authority) {
      <td>{{ authority.name }}</td>
      <td>{{ authority.url || '-' }}</td>
      <td class="hidden">{{ authority.contact?.join(', ') || '-' }}</td>
      <td>
        <button
          tuiIconButton
          tuiDropdown
          size="s"
          appearance="flat-grayscale"
          iconStart="@tui.ellipsis-vertical"
          [tuiAppearanceState]="open ? 'hover' : null"
          [(tuiDropdownOpen)]="open"
        >
          {{ 'More' | i18n }}
          <tui-data-list *tuiTextfieldDropdown>
            @if (authority.url) {
              <tui-opt-group>
                <button
                  tuiOption
                  new
                  iconStart="@tui.pencil"
                  (click)="service.edit($any(authority))"
                >
                  {{ 'Edit' | i18n }}
                </button>
              </tui-opt-group>
              <tui-opt-group>
                <button
                  tuiOption
                  new
                  iconStart="@tui.trash"
                  class="g-negative"
                  (click)="service.remove($any(authority))"
                >
                  {{ 'Delete' | i18n }}
                </button>
              </tui-opt-group>
            } @else {
              <tui-opt-group>
                <a
                  tuiOption
                  new
                  download
                  iconStart="@tui.download"
                  href="/static/local-root-ca.crt"
                >
                  {{ 'Download your Root CA' | i18n }}
                </a>
              </tui-opt-group>
            }
          </tui-data-list>
        </button>
      </td>
    }
  `,
  styles: `
    td:last-child {
      grid-area: 1 / 2 / 4;
      align-self: center;
      text-align: right;
    }

    :host-context(tui-root._mobile) {
      grid-template-columns: 1fr min-content;

      .hidden {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, i18nPipe, TuiDropdown, TuiDataList, TuiTextfield],
})
export class AuthorityItemComponent {
  protected readonly service = inject(AuthorityService)

  readonly authority = input.required<Authority>()

  open = false
}

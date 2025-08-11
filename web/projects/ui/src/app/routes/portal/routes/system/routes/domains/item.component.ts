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
import { DomainService, MappedDomain } from './domain.service'

@Component({
  selector: 'tr[domain]',
  template: `
    @if (domain(); as domain) {
      <td>{{ domain.fqdn }}</td>
      <td>{{ domain.gateway.ipInfo?.name || '-' }}</td>
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
            <tui-opt-group>
              <button
                tuiOption
                new
                iconStart="@tui.eye"
                (click)="domainService.showDns(domain)"
              >
                {{ 'View DNS' | i18n }}
              </button>
              <button
                tuiOption
                new
                iconStart="@tui.pencil"
                (click)="domainService.edit(domain)"
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
                (click)="domainService.remove(domain.fqdn)"
              >
                {{ 'Delete' | i18n }}
              </button>
            </tui-opt-group>
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
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, i18nPipe, TuiDropdown, TuiDataList, TuiTextfield],
})
export class DomainItemComponent {
  protected readonly domainService = inject(DomainService)

  readonly domain = input.required<MappedDomain>()

  open = false
}

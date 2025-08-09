import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiTextfield,
} from '@taiga-ui/core'
import { TuiBadge } from '@taiga-ui/kit'
import { filter } from 'rxjs'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { InterfaceComponent } from './interface.component'
import { ClearnetDomain } from './interface.service'

@Component({
  selector: 'tr[domain]',
  template: `
    <td>{{ domain().fqdn }}</td>
    <td>{{ domain().authority || '-' }}</td>
    <td>
      @if (domain().public) {
        <tui-badge size="s" appearance="primary-success">
          {{ 'Public' | i18n }}
        </tui-badge>
      } @else {
        <tui-badge size="s" appearance="primary-destructive">
          {{ 'Private' | i18n }}
        </tui-badge>
      }
    </td>
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
              [iconStart]="domain().public ? '@tui.eye-off' : '@tui.eye'"
              (click)="toggle()"
            >
              @if (domain().public) {
                {{ 'Make private' | i18n }}
              } @else {
                {{ 'Make public' | i18n }}
              }
            </button>
            <button tuiOption new iconStart="@tui.pencil" (click)="edit()">
              {{ 'Edit' | i18n }}
            </button>
          </tui-opt-group>
          <tui-opt-group>
            <button
              tuiOption
              new
              iconStart="@tui.trash"
              class="g-negative"
              (click)="remove()"
            >
              {{ 'Delete' | i18n }}
            </button>
          </tui-opt-group>
        </tui-data-list>
      </button>
    </td>
  `,
  styles: `
    :host {
      grid-template-columns: min-content 1fr min-content;
    }

    td:nth-child(2) {
      order: -1;
      grid-column: span 2;
    }

    td:last-child {
      grid-area: 1 / 3 / 3;
      align-self: center;
      text-align: right;
    }

    :host-context(tui-root._mobile) {
      tui-badge {
        vertical-align: bottom;
        margin-inline-start: 0.25rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiButton,
    TuiDataList,
    TuiDropdown,
    i18nPipe,
    TuiTextfield,
    TuiBadge,
  ],
})
export class DomainComponent {
  private readonly dialog = inject(DialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly interface = inject(InterfaceComponent)

  readonly domain = input.required<ClearnetDomain>()

  open = false

  toggle() {}

  edit() {}

  remove() {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Removing').subscribe()
        const params = { fqdn: this.domain().fqdn }

        try {
          if (this.interface.packageId()) {
            await this.api.pkgRemoveDomain({
              ...params,
              package: this.interface.packageId(),
              host: this.interface.value().addressInfo.hostId,
            })
          } else {
            await this.api.osUiRemoveDomain(params)
          }
          return true
        } catch (e: any) {
          this.errorService.handleError(e)
          return false
        } finally {
          loader.unsubscribe()
        }
      })
  }
}

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
import { ISB, T } from '@start9labs/start-sdk'
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiOptGroup,
  TuiTextfield,
} from '@taiga-ui/core'
import { filter } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

export type GatewayPlus = T.NetworkInterfaceInfo & {
  id: string
  ipInfo: T.IpInfo
  ipv4: string[]
}

@Component({
  selector: 'tr[gateway]',
  template: `
    @if (gateway(); as gateway) {
      <td [style.grid-column]="'span 2'">{{ gateway.ipInfo.name }}</td>
      <td class="type">{{ gateway.ipInfo.deviceType || '-' }}</td>
      <td [style.order]="-2">
        {{ gateway.public ? ('Public' | i18n) : ('Private' | i18n) }}
      </td>
      <td class="lan">{{ gateway.ipv4.join(', ') }}</td>
      <td
        class="wan"
        [style.color]="
          gateway.ipInfo.wanIp ? 'var(--tui-text-warning)' : undefined
        "
      >
        {{ gateway.ipInfo.wanIp || ('Error' | i18n) }}
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
              <button tuiOption new iconStart="@tui.pencil" (click)="rename()">
                {{ 'Rename' | i18n }}
              </button>
            </tui-opt-group>
            @if (gateway.ipInfo.deviceType === 'wireguard') {
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
            }
          </tui-data-list>
        </button>
      </td>
    }
  `,
  styles: `
    td:last-child {
      grid-area: 1 / 3 / 5;
      align-self: center;
      text-align: right;
    }

    :host-context(tui-root._mobile) {
      grid-template-columns: min-content 1fr min-content;

      .type {
        order: -1;

        &::before {
          content: '\\00A0(';
        }

        &::after {
          content: ')';
        }
      }

      .lan,
      .wan {
        grid-column: span 2;

        &::before {
          content: 'LAN IP: ';
          color: var(--tui-text-primary);
        }
      }

      .wan::before {
        content: 'WAN IP: ';
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiButton,
    TuiDropdown,
    TuiDataList,
    TuiOptGroup,
    TuiTextfield,
    i18nPipe,
  ],
})
export class GatewaysItemComponent {
  private readonly dialog = inject(DialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  readonly gateway = input.required<GatewayPlus>()

  open = false

  remove() {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
          await this.api.removeTunnel({ id: this.gateway().id })
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async rename() {
    const { ipInfo, id } = this.gateway()
    const renameSpec = ISB.InputSpec.of({
      label: ISB.Value.text({
        name: 'Label',
        required: true,
        default: ipInfo?.name || null,
      }),
    })

    this.formDialog.open(FormComponent, {
      label: 'Rename',
      data: {
        spec: await configBuilderToSpec(renameSpec),
        buttons: [
          {
            text: 'Save',
            handler: (value: typeof renameSpec._TYPE) =>
              this.update(id, value.label),
          },
        ],
      },
    })
  }

  private async update(id: string, name: string): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.updateTunnel({ id, name })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }
}

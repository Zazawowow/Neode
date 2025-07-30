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
import { ISB } from '@start9labs/start-sdk'
import { TuiSkeleton } from '@taiga-ui/kit'
import { filter } from 'rxjs'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { GatewayWithID } from './item.component'
import { GatewaysItemComponent } from './item.component'

@Component({
  selector: '[gateways]',
  template: `
    <table
      [appTable]="[
        'Name',
        'Type',
        'Access',
        $any('LAN IPs'),
        $any('WAN IP'),
        null,
      ]"
    >
      @for (proxy of gateways(); track $index) {
        <tr
          [proxy]="proxy"
          (onRename)="rename($event)"
          (onRemove)="remove($event.id)"
        ></tr>
      } @empty {
        <tr>
          <td colspan="5">
            <div [tuiSkeleton]="true">{{ 'Loading' | i18n }}</div>
          </td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      grid-column: span 6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiSkeleton, i18nPipe, TableComponent, GatewaysItemComponent],
})
export class GatewaysTableComponent<T extends GatewayWithID> {
  readonly gateways = input<readonly T[] | null>(null)

  private readonly dialog = inject(DialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  remove(id: string) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
          await this.api.removeTunnel({ id })
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async rename(gateway: GatewayWithID) {
    const renameSpec = ISB.InputSpec.of({
      label: ISB.Value.text({
        name: 'Label',
        required: true,
        default: gateway.ipInfo?.name || null,
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
              this.update(gateway.id, value.label),
          },
        ],
      },
    })
  }

  private async update(id: string, label: string): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.updateTunnel({ id, name: label })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }
}

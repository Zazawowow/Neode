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
import { WireguardProxy } from './item.component'
import { ProxiesItemComponent } from './item.component'

@Component({
  selector: '[proxies]',
  template: `
    <table [appTable]="['Label', 'Type', null]">
      @for (proxy of proxies(); track $index) {
        <tr
          [proxy]="proxy"
          (onRename)="rename($event)"
          (onRemove)="remove($event.id)"
        ></tr>
      } @empty {
        @if (proxies()) {
          <tr>
            <td colspan="5">{{ 'No proxies' | i18n }}</td>
          </tr>
        } @else {
          <tr>
            <td colspan="5">
              <div [tuiSkeleton]="true">{{ 'Loading' | i18n }}</div>
            </td>
          </tr>
        }
      }
    </table>
  `,
  styles: `
    :host {
      grid-column: span 6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiSkeleton, i18nPipe, TableComponent, ProxiesItemComponent],
})
export class ProxiesTableComponent<T extends WireguardProxy> {
  readonly proxies = input<readonly T[] | null>(null)

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
          await this.api.removeProxy({ id })
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async rename(proxy: WireguardProxy) {
    const renameSpec = ISB.InputSpec.of({
      label: ISB.Value.text({
        name: 'Label',
        required: true,
        default: proxy.ipInfo?.name || null,
      }),
    })

    this.formDialog.open(FormComponent, {
      label: 'Update Label',
      data: {
        spec: await configBuilderToSpec(renameSpec),
        buttons: [
          {
            text: 'Save',
            handler: (value: typeof renameSpec._TYPE) =>
              this.update(proxy.id, value.label),
          },
        ],
      },
    })
  }

  private async update(id: string, label: string): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.updateProxy({ id, label })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }
}

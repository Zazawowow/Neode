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
import { DomainsItemComponent } from './item.component'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'

@Component({
  selector: '[domains]',
  template: `
    <table [appTable]="['Domain', 'Gateway', 'Default ACME', null]">
      @for (domain of domains(); track $index) {
        <tr
          [domain]="domain"
          (onGateway)="changeGateway($event)"
          (onAcme)="changeAcme($event)"
          (onRemove)="remove($event)"
        ></tr>
      } @empty {
        @if (domains()) {
          <app-placeholder icon="@tui.award">
            {{ 'No domains' | i18n }}
          </app-placeholder>
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
  imports: [
    TuiSkeleton,
    i18nPipe,
    TableComponent,
    DomainsItemComponent,
    PlaceholderComponent,
  ],
})
export class DomainsTableComponent<T extends any> {
  readonly domains = input<readonly T[] | null>(null)

  private readonly dialog = inject(DialogService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  remove(domain: any) {
    this.dialog
      .openConfirm({ label: 'Are you sure?', size: 's' })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const loader = this.loader.open('Deleting').subscribe()

        try {
        } catch (e: any) {
          this.errorService.handleError(e)
        } finally {
          loader.unsubscribe()
        }
      })
  }

  async changeGateway(domain: any) {
    const renameSpec = ISB.InputSpec.of({})

    this.formDialog.open(FormComponent, {
      label: 'Change gateway',
      data: {
        spec: await configBuilderToSpec(renameSpec),
        buttons: [
          {
            text: 'Save',
            handler: (value: typeof renameSpec._TYPE) => {},
          },
        ],
      },
    })
  }

  async changeAcme(domain: any) {
    const renameSpec = ISB.InputSpec.of({})

    this.formDialog.open(FormComponent, {
      label: 'Change default ACME',
      data: {
        spec: await configBuilderToSpec(renameSpec),
        buttons: [
          {
            text: 'Save',
            handler: (value: typeof renameSpec._TYPE) => {},
          },
        ],
      },
    })
  }
}

import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  DocsLinkDirective,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { GatewaysTableComponent } from './table.component'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { TitleDirective } from 'src/app/services/title.service'
import { ISB } from '@start9labs/start-sdk'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Gateways' | i18n }}
    </ng-container>

    <section class="g-card">
      <header>
        {{ 'Gateways' | i18n }}
        <a
          tuiIconButton
          size="xs"
          docsLink
          path="/user-manual/gateways.html"
          appearance="icon"
          iconStart="@tui.external-link"
        >
          {{ 'Documentation' | i18n }}
        </a>
        <button
          tuiButton
          size="xs"
          [style.margin]="'0 0.5rem 0 auto'"
          iconStart="@tui.plus"
          (click)="add()"
        >
          Add
        </button>
      </header>
      <gateways-table />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    TuiButton,
    GatewaysTableComponent,
    TitleDirective,
    i18nPipe,
    DocsLinkDirective,
  ],
})
export default class GatewaysComponent {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  async add() {
    this.formDialog.open(FormComponent, {
      label: 'Add gateway',
      data: {
        spec: await configBuilderToSpec(gatewaySpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof gatewaySpec._TYPE) => this.save(input),
          },
        ],
      },
    })
  }

  private async save(input: typeof gatewaySpec._TYPE): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.addTunnel({
        name: input.name,
        config: '' as string, // @TODO alex/matt when types arrive
        public: input.type === 'public',
      })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }
}

const gatewaySpec = ISB.InputSpec.of({
  name: ISB.Value.text({
    name: 'Name',
    description: 'A name to easily identify the gateway',
    required: true,
    default: null,
  }),
  type: ISB.Value.select({
    name: 'Type',
    description:
      '-**Private**: select this option if the gateway is configured for private access to authorized clients only. StartTunnel is a private gateway.\n-**Public**: select this option if the gateway is configured for unfettered public access.',
    default: 'private',
    values: {
      private: 'Private',
      public: 'Public',
    },
  }),
  config: ISB.Value.union({
    name: 'Wireguard Config',
    default: 'paste',
    variants: ISB.Variants.of({
      paste: {
        name: 'Paste File Contents',
        spec: ISB.InputSpec.of({
          file: ISB.Value.textarea({
            name: 'Paste File Contents',
            default: null,
            required: true,
          }),
        }),
      },
      upload: {
        name: 'Upload File',
        spec: ISB.InputSpec.of({
          file: ISB.Value.file({
            name: 'File',
            required: true,
            extensions: ['.conf'],
          }),
        }),
      },
    }),
  }),
})

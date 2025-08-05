import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import {
  DocsLinkDirective,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { TuiButton, TuiLink } from '@taiga-ui/core'
import { PatchDB } from 'patch-db-client'
import { FormComponent } from 'src/app/routes/portal/components/form.component'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { GatewaysTableComponent } from './table.component'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { TitleDirective } from 'src/app/services/title.service'
import { TuiHeader } from '@taiga-ui/layout'
import { map } from 'rxjs'
import { ISB } from '@start9labs/start-sdk'
import { GatewayWithID } from './item.component'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Gateways' | i18n }}
    </ng-container>
    <header tuiHeader>
      <hgroup tuiTitle>
        <h3>{{ 'Gateways' | i18n }}</h3>
        <p tuiSubtitle>
          {{
            'Gateways connect your server to the Internet. They process outbound traffic, and under certain conditions, they also permit inbound traffic.'
              | i18n
          }}
          <a
            tuiLink
            docsLink
            path="/user-manual/gateways.html"
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
        {{ 'Gateways' | i18n }}
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
      <div [gateways]="gateways$ | async"></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TuiButton,
    GatewaysTableComponent,
    TuiHeader,
    TitleDirective,
    i18nPipe,
    TuiLink,
    DocsLinkDirective,
  ],
})
export default class GatewaysComponent {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  readonly gateways$ = inject<PatchDB<DataModel>>(PatchDB)
    .watch$('serverInfo', 'network', 'networkInterfaces')
    .pipe(
      map(gateways =>
        Object.entries(gateways).map(
          ([id, val]) =>
            ({
              ...val,
              id,
            }) as GatewayWithID,
        ),
      ),
    )

  readonly gatewaySpec = ISB.InputSpec.of({
    name: ISB.Value.text({
      name: 'Name',
      description: 'A name to easily identify the gateway',
      required: true,
      default: null,
    }),
    type: ISB.Value.select({
      name: 'Type',
      description:
        '-**Private**: select this option if the gateway is configured for private access to authorized clients only, which usually means ports are closed and traffic blocked otherwise. StartTunnel is a private gateway.\n-**Public**: select this option if the gateway is configured for unfettered public access, which usually means ports are open and traffic forwarded.',
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

  async add() {
    this.formDialog.open(FormComponent, {
      label: 'Add Gateway',
      data: {
        spec: await configBuilderToSpec(this.gatewaySpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof this.gatewaySpec._TYPE) => this.save(input),
          },
        ],
      },
    })
  }

  private async save(input: typeof this.gatewaySpec._TYPE): Promise<boolean> {
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

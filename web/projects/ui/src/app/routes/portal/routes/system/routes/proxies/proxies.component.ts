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
import { ProxiesTableComponent } from './table.component'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { TitleDirective } from 'src/app/services/title.service'
import { TuiHeader } from '@taiga-ui/layout'
import { map } from 'rxjs'
import { ISB, T } from '@start9labs/start-sdk'
import { WireguardIpInfo, WireguardProxy } from './item.component'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'Inbound Proxies' | i18n }}
    </ng-container>
    <header tuiHeader>
      <hgroup tuiTitle>
        <h3>{{ 'Inbound Proxies' | i18n }}</h3>
        <p tuiSubtitle>
          {{
            'Inbound proxies provide remote access to your server and installed services.'
              | i18n
          }}
          <a
            tuiLink
            docsLink
            href="/user-manual/inbound-proxies"
            appearance="action-grayscale"
            iconEnd="@tui.external-link"
            [pseudo]="true"
            [textContent]="'View instructions'"
          ></a>
        </p>
      </hgroup>
    </header>

    <section class="g-card">
      <header>
        {{ 'Saved Proxies' | i18n }}
        <button tuiButton size="xs" iconStart="@tui.plus" (click)="add()">
          Add
        </button>
      </header>
      <div #table [proxies]="proxies$ | async"></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TuiButton,
    ProxiesTableComponent,
    TuiHeader,
    TitleDirective,
    i18nPipe,
    TuiLink,
    DocsLinkDirective,
  ],
})
export default class ProxiesComponent {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly formDialog = inject(FormDialogService)

  readonly proxies$ = inject<PatchDB<DataModel>>(PatchDB)
    .watch$('serverInfo', 'network')
    .pipe(
      map(network =>
        Object.entries(network.networkInterfaces)
          .filter(
            (
              record,
            ): record is [
              string,
              T.NetworkInterfaceInfo & { ipInfo: WireguardIpInfo },
            ] => record[1].ipInfo?.deviceType === 'wireguard',
          )
          .map(
            ([id, val]) =>
              ({
                ...val,
                id,
              }) as WireguardProxy,
          ),
      ),
    )

  readonly wireguardSpec = ISB.InputSpec.of({
    label: ISB.Value.text({
      name: 'Label',
      description: 'To help identify this proxy',
      required: true,
      default: null,
    }),
    type: ISB.Value.select({
      name: 'Type',
      description:
        '-**Private**: a private inbound proxy is used to access your server and installed services privately. Only clients configured and authorized to use the proxy will be granted access.\n-**Public**: a public inbound proxy is used to expose service interfaces on a case-by-case basis to the public Internet without exposing your home IP address. Only service interfaces explicitly marked "Public" will be accessible via the proxy.',
      default: 'private',
      values: {
        private: 'Private',
        public: 'Public',
      },
    }),
    config: ISB.Value.union({
      name: 'Config',
      default: 'upload',
      variants: ISB.Variants.of({
        upload: {
          name: 'File',
          spec: ISB.InputSpec.of({
            file: ISB.Value.file({
              name: 'Wiregaurd Config',
              required: true,
              extensions: ['.conf'],
            }),
          }),
        },
        paste: {
          name: 'Copy/Paste',
          spec: ISB.InputSpec.of({
            file: ISB.Value.textarea({
              name: 'Paste File Contents',
              default: null,
              required: true,
            }),
          }),
        },
      }),
    }),
  })

  async add() {
    this.formDialog.open(FormComponent, {
      label: 'Add Proxy',
      data: {
        spec: await configBuilderToSpec(this.wireguardSpec),
        buttons: [
          {
            text: 'Save',
            handler: (input: typeof this.wireguardSpec._TYPE) =>
              this.save(input),
          },
        ],
      },
    })
  }

  private async save(input: typeof this.wireguardSpec._TYPE): Promise<boolean> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.addTunnel({
        name: input.label,
        config: input.config.value.file as string, // @TODO alex this is the file represented as a string
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

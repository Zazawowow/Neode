import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core'
import {
  DocsLinkDirective,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { TuiSkeleton } from '@taiga-ui/kit'
import { PlaceholderComponent } from 'src/app/routes/portal/components/placeholder.component'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { InterfaceClearnetDomainsItemComponent } from './item.component'
import { ClearnetDomain } from '../interface.service'
import { ISB, utils } from '@start9labs/start-sdk'
import { FormDialogService } from 'src/app/services/form-dialog.service'
import { FormComponent } from '../../form.component'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'
import { PatchDB } from 'patch-db-client'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { toAuthorityName } from 'src/app/utils/acme'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { InterfaceComponent } from '../interface.component'

// @TODO translations

@Component({
  selector: 'section[clearnetDomains]',
  template: `
    <header>
      {{ 'Clearnet Domains' | i18n }}
      <a
        tuiIconButton
        docsLink
        path="/user-manual/connecting-remotely/clearnet.html"
        appearance="icon"
        iconStart="@tui.external-link"
      >
        {{ 'Documentation' | i18n }}
      </a>
      <button
        tuiButton
        iconStart="@tui.plus"
        [style.margin-inline-start]="'auto'"
        (click)="add()"
      >
        {{ 'Add' | i18n }}
      </button>
    </header>
    <table [appTable]="['Domain', 'Certificate Authority', 'Type', null]">
      @for (domain of clearnetDomains(); track $index) {
        <tr [domain]="domain"></tr>
      } @empty {
        @if (clearnetDomains()) {
          <tr>
            <td colspan="4">
              <app-placeholder icon="@tui.globe">
                {{ 'No clearnet domains' | i18n }}
              </app-placeholder>
            </td>
          </tr>
        } @else {
          @for (_ of [0, 1]; track $index) {
            <tr>
              <td colspan="4">
                <div [tuiSkeleton]="true">{{ 'Loading' | i18n }}</div>
              </td>
            </tr>
          }
        }
      }
    </table>
  `,
  styles: `
    :host {
      grid-column: span 3;
    }
  `,
  host: { class: 'g-card' },
  imports: [
    TuiButton,
    TableComponent,
    PlaceholderComponent,
    i18nPipe,
    DocsLinkDirective,
    InterfaceClearnetDomainsItemComponent,
    TuiSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceClearnetDomainsComponent {
  private readonly formDialog = inject(FormDialogService)
  private readonly patch = inject<PatchDB<DataModel>>(PatchDB)
  private readonly api = inject(ApiService)
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly interface = inject(InterfaceComponent)

  readonly clearnetDomains = input.required<
    readonly ClearnetDomain[] | undefined
  >()

  private readonly domains = toSignal(
    this.patch.watch$('serverInfo', 'network', 'domains'),
  )

  private readonly acme = toSignal(
    this.patch.watch$('serverInfo', 'network', 'acme').pipe(
      map(acme =>
        Object.keys(acme).reduce<Record<string, string>>(
          (obj, url) => ({
            ...obj,
            [url]: toAuthorityName(url),
          }),
          { local: toAuthorityName(null) },
        ),
      ),
    ),
  )

  async add() {
    const addSpec = ISB.InputSpec.of({
      type: ISB.Value.union({
        name: 'Type',
        default: 'public',
        description:
          '- **Public**: the domain can be accessed by anyone with an Internet connection.\n- **Private**: the domain can only be accessed by people connected to the same Local Area Network (LAN) as the server, either physically or via VPN.',
        variants: ISB.Variants.of({
          public: {
            name: 'Public',
            spec: ISB.InputSpec.of({
              domain: ISB.Value.select({
                name: 'Domain',
                default: '',
                values: Object.keys(this.domains() || {}).reduce<
                  Record<string, string>
                >(
                  (obj, domain) => ({
                    ...obj,
                    [domain]: domain,
                  }),
                  {},
                ),
              }),
              subdomain: ISB.Value.text({
                name: 'Subdomain',
                description: 'Optionally enter a subdomain',
                required: false,
                default: null,
                patterns: [], // @TODO subdomain pattern
              }),
              ...this.acmeSpec(true),
            }),
          },
          private: {
            name: 'Private',
            spec: ISB.InputSpec.of({
              fqdn: ISB.Value.text({
                name: 'Domain',
                description:
                  'Enter a fully qualified domain name. For example, if you control domain.com, you could enter domain.com or subdomain.domain.com or another.subdomain.domain.com.',
                required: true,
                default: null,
                patterns: [utils.Patterns.domain],
              }),
              ...this.acmeSpec(false),
            }),
          },
        }),
      }),
    })

    this.formDialog.open(FormComponent, {
      label: 'Add domain',
      data: {
        spec: await configBuilderToSpec(addSpec),
        buttons: [
          {
            text: 'Save',
            handler: async (input: typeof addSpec._TYPE) => {
              const loader = this.loader.open('Removing').subscribe()
              const type = input.type.selection
              const params = {
                private: type === 'private',
                fqdn:
                  type === 'public'
                    ? `${input.type.value.subdomain}.${input.type.value.domain}`
                    : input.type.value.fqdn,
                acme:
                  input.type.value.authority === 'local'
                    ? null
                    : input.type.value.authority,
              }
              try {
                if (this.interface.packageId()) {
                  await this.api.pkgAddDomain({
                    ...params,
                    package: this.interface.packageId(),
                    host: this.interface.value()?.addressInfo.hostId || '',
                  })
                } else {
                  await this.api.osUiAddDomain(params)
                }
                return true
              } catch (e: any) {
                this.errorService.handleError(e)
                return false
              } finally {
                loader.unsubscribe()
              }
            },
          },
        ],
      },
    })
  }

  private acmeSpec(isPublic: boolean) {
    return {
      authority: ISB.Value.select({
        name: 'Certificate Authority',
        description:
          'Select the Certificate Authority that will issue the SSL/TLS certificate for this domain',
        values: this.acme()!,
        default: isPublic ? '' : 'local',
      }),
    }
  }
}

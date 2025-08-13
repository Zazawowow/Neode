import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import {
  DocsLinkDirective,
  ErrorService,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { ISB } from '@start9labs/start-sdk'
import { TuiButton, TuiTitle } from '@taiga-ui/core'
import { TuiHeader } from '@taiga-ui/layout'
import { PatchDB } from 'patch-db-client'
import { combineLatest, first, switchMap } from 'rxjs'
import { FormModule } from 'src/app/routes/portal/components/form/form.module'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { FormService } from 'src/app/services/form.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { TitleDirective } from 'src/app/services/title.service'
import { configBuilderToSpec } from 'src/app/utils/configBuilderToSpec'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ 'DNS Servers' | i18n }}
    </ng-container>
    @if (data(); as d) {
      <form [formGroup]="d.form">
        <header tuiHeader="body-l">
          <h3 tuiTitle>
            <b>
              {{ 'DNS Servers' | i18n }}
              <a
                tuiIconButton
                size="xs"
                docsLink
                path="/user-manual/dns.html"
                appearance="icon"
                iconStart="@tui.external-link"
              >
                {{ 'Documentation' | i18n }}
              </a>
            </b>
          </h3>
        </header>

        <form-group [spec]="d.spec" />

        @if (d.warn.length; as length) {
          <p>
            Warning. StartOS is currently using {{ d.warn.join(', ') }} for DNS.
            Therefore, {{ length > 1 ? 'they' : 'it' }} cannot use StartOS for
            DNS. This is circular. If you want to use StartOS as the DNS server
            for {{ d.warn.join(', ') }} for private domain resolution, you must
            set custom DNS servers above.
          </p>
        }

        <footer>
          <button
            tuiButton
            size="l"
            [disabled]="d.form.invalid || d.form.pristine"
            (click)="save(d.form.value)"
          >
            {{ 'Save' | i18n }}
          </button>
        </footer>
      </form>
    }
  `,
  styles: `
    :host {
      max-width: 36rem;
    }

    form header,
    form footer {
      margin: 1rem 0;
      display: flex;
      gap: 1rem;
    }

    footer {
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormModule,
    TuiButton,
    TuiHeader,
    TuiTitle,
    RouterLink,
    TitleDirective,
    i18nPipe,
    DocsLinkDirective,
  ],
})
export default class SystemDnsComponent {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly formService = inject(FormService)
  private readonly patch = inject<PatchDB<DataModel>>(PatchDB)
  private readonly api = inject(ApiService)
  private readonly i18n = inject(i18nPipe)

  private readonly dnsSpec = ISB.InputSpec.of({
    strategy: ISB.Value.union({
      name: 'DNS Servers',
      default: 'defaults',
      variants: ISB.Variants.of({
        defaults: {
          name: 'Default',
          spec: ISB.InputSpec.of({
            servers: ISB.Value.list(
              ISB.List.text(
                {
                  name: 'Default DNS Servers',
                },
                {},
              ),
            ),
          }),
        },
        custom: {
          name: 'Custom',
          spec: ISB.InputSpec.of({
            servers: ISB.Value.list(
              ISB.List.text(
                {
                  name: 'DNS Servers',
                  minLength: 1,
                  maxLength: 3,
                },
                { placeholder: '1.1.1.1' },
              ),
            ),
          }),
        },
      }),
    }),
  })

  readonly data = toSignal(
    combineLatest([
      this.patch.watch$('packageData').pipe(first()),
      this.patch.watch$('serverInfo', 'network'),
    ]).pipe(
      switchMap(async ([pkgs, { gateways, dns }]) => {
        const spec = await configBuilderToSpec(this.dnsSpec)

        const selection = dns.static ? 'custom' : 'defaults'

        const form = this.formService.createForm(spec, {
          strategy: { selection, value: dns.servers },
        })

        return {
          spec,
          form,
          warn:
            (Object.values(pkgs).some(p => p) || []) &&
            Object.values(gateways)
              .filter(g => dns.servers.includes(g.ipInfo?.lanIp))
              .map(g => g.ipInfo?.name),
        }
      }),
    ),
  )

  async save(value: typeof this.dnsSpec._TYPE): Promise<void> {
    const loader = this.loader.open('Saving').subscribe()

    try {
      await this.api.setDns({
        servers: value.strategy.value.servers,
        static: value.strategy.selection === 'custom',
      })
    } catch (e: any) {
      this.errorService.handleError(e)
    } finally {
      loader.unsubscribe()
    }
  }
}

import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  DialogService,
  ErrorService,
  i18nKey,
  i18nPipe,
} from '@start9labs/shared'
import { TuiButton, TuiDialogContext, TuiIcon } from '@taiga-ui/core'
import {
  TuiButtonLoading,
  TuiSwitch,
  tuiSwitchOptionsProvider,
} from '@taiga-ui/kit'
import { injectContext, PolymorpheusComponent } from '@taiga-ui/polymorpheus'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { parse } from 'tldts'
import { MappedDomain } from './domain.service'

// @TODO translations

@Component({
  selector: 'dns',
  template: `
    @let wanIp = context.data.gateway.ipInfo?.wanIp || ('Error' | i18n);

    @if (context.data.gateway.ipInfo?.deviceType !== 'wireguard') {
      <label>
        IP
        <input type="checkbox" tuiSwitch [(ngModel)]="mode" />
        Dynamic DNS
      </label>
    }

    <table [appTable]="[$any('Record'), $any('Host'), 'Value', 'Purpose']">
      @if (mode) {
        <tr>
          <td>
            @if (root() !== undefined; as $implicit) {
              <ng-container
                [ngTemplateOutlet]="test"
                [ngTemplateOutletContext]="{ $implicit }"
              />
            }
            ALIAS
          </td>
          <td>{{ subdomain() || '@' }}</td>
          <td>[DDNS Address]</td>
          <td></td>
        </tr>
        <tr>
          <td>
            @if (wildcard() !== undefined; as $implicit) {
              <ng-container
                [ngTemplateOutlet]="test"
                [ngTemplateOutletContext]="{ $implicit }"
              />
            }
            ALIAS
          </td>
          <td>{{ subdomain() ? '*.' + subdomain() : '*' }}</td>
          <td>[DDNS Address]</td>
          <td></td>
        </tr>
      } @else {
        <tr>
          <td>
            @if (root() !== undefined; as $implicit) {
              <ng-container
                [ngTemplateOutlet]="test"
                [ngTemplateOutletContext]="{ $implicit }"
              />
            }
            A
          </td>
          <td>{{ subdomain() || '@' }}</td>
          <td>{{ wanIp }}</td>
          <td></td>
        </tr>
        <tr>
          <td>
            @if (wildcard() !== undefined; as $implicit) {
              <ng-container
                [ngTemplateOutlet]="test"
                [ngTemplateOutletContext]="{ $implicit }"
              />
            }
            A
          </td>
          <td>{{ subdomain() ? '*.' + subdomain() : '*' }}</td>
          <td>{{ wanIp }}</td>
          <td></td>
        </tr>
      }
    </table>

    <ng-template #test let-result>
      @if (result) {
        <tui-icon class="g-positive" icon="@tui.check" />
      } @else {
        <tui-icon class="g-negative" icon="@tui.x" />
      }
    </ng-template>

    <footer class="g-buttons">
      <button tuiButton [loading]="loading()" (click)="testDns()">
        {{ 'Test' | i18n }}
      </button>
    </footer>
  `,
  styles: `
    label {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin: 1rem 0;
    }

    tui-icon {
      font-size: 1rem;
      vertical-align: text-bottom;
    }
  `,
  providers: [
    tuiSwitchOptionsProvider({
      appearance: () => 'primary',
      icon: () => '',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiButton,
    i18nPipe,
    TableComponent,
    TuiSwitch,
    FormsModule,
    TuiButtonLoading,
    NgTemplateOutlet,
    TuiIcon,
  ],
})
export class DnsComponent {
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly dialog = inject(DialogService)

  mode = false

  readonly context = injectContext<TuiDialogContext<void, MappedDomain>>()

  readonly subdomain = computed(() => parse(this.context.data.fqdn).subdomain)
  readonly loading = signal(false)
  readonly root = signal<boolean | undefined>(undefined)
  readonly wildcard = signal<boolean | undefined>(undefined)

  async testDns() {
    this.loading.set(true)

    try {
      await this.api
        .testDomain({
          fqdn: this.context.data.fqdn,
          gateway: this.context.data.gateway.id,
        })
        .then(({ root, wildcard }) => {
          this.root.set(root)
          this.wildcard.set(wildcard)
        })
    } catch (e: any) {
      this.errorService.handleError(e)
    } finally {
      this.loading.set(false)
    }
  }

  description(subdomain: boolean) {
    const message = subdomain
      ? `This DNS record routes ${this.context.data.fqdn} (no subdomain) to your server.`
      : `This DNS record routes subdomains of ${this.context.data.fqdn} to your server.`

    this.dialog
      .openAlert(message as i18nKey, { label: 'Purpose' as i18nKey })
      .subscribe()
  }
}

export const DNS = new PolymorpheusComponent(DnsComponent)

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import {
  DialogService,
  ErrorService,
  i18nKey,
  i18nPipe,
  LoadingService,
} from '@start9labs/shared'
import { TuiButton, TuiDialogContext } from '@taiga-ui/core'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { MappedDomain } from './domain.service'
import { injectContext, PolymorpheusComponent } from '@taiga-ui/polymorpheus'
import { TableComponent } from 'src/app/routes/portal/components/table.component'
import { parse } from 'tldts'

// @TODO translations

@Component({
  selector: 'dns',
  template: `
    @let wanIp = context.data.gateway.ipInfo?.wanIp || ('Error' | i18n);

    <table [appTable]="[$any('Record'), $any('Host'), 'Value', 'Purpose']">
      <tr>
        <td>A</td>
        <td>{{ subdomain() || '@' }}</td>
        <td>{{ wanIp }}</td>
        <td></td>
      </tr>
      <tr>
        <td>A</td>
        <td>{{ subdomain() ? '*.' + subdomain() : '*' }}</td>
        <td>{{ wanIp }}</td>
        <td></td>
      </tr>

      <!-- <tr>
        <td>ALIAS</td>
        <td>{{ subdomain() || '@' }}</td>
        <td>[DDNS Address]</td>
        <td></td>
      </tr>
      <tr>
        <td>ALIAS</td>
        <td>{{ subdomain() ? '*.' + subdomain() : '*' }}</td>
        <td>[DDNS Address]</td>
        <td></td>
      </tr> -->
    </table>

    <footer class="g-buttons">
      <button tuiButton size="l" (click)="testDns()">
        {{ 'Test' | i18n }}
      </button>
    </footer>
  `,
  styles: `
    section {
      margin: 1.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, i18nPipe, TableComponent],
})
export class DnsComponent {
  private readonly loader = inject(LoadingService)
  private readonly errorService = inject(ErrorService)
  private readonly api = inject(ApiService)
  private readonly dialog = inject(DialogService)

  readonly context = injectContext<TuiDialogContext<void, MappedDomain>>()

  readonly subdomain = computed(() => parse(this.context.data.fqdn).subdomain)

  async testDns() {
    const loader = this.loader.open().subscribe()

    try {
      await this.api.testDomain({
        fqdn: this.context.data.fqdn,
        gateway: this.context.data.gateway.id,
      })
      return true
    } catch (e: any) {
      this.errorService.handleError(e)
      return false
    } finally {
      loader.unsubscribe()
    }
  }

  description(subdomain: boolean) {
    const message = subdomain
      ? `This DNS record routes ${this.context.data.fqdn} (no subdomain) to your server.`
      : `This DNS record routes subdomains of ${this.context.data.fqdn} to your server.`

    this.dialog
      .openAlert(message as i18nKey, {
        label: 'Purpose' as i18nKey,
      })
      .subscribe()
  }
}

export const DNS = new PolymorpheusComponent(DnsComponent)

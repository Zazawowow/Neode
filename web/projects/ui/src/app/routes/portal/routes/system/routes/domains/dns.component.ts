import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ErrorService, i18nPipe, LoadingService } from '@start9labs/shared'
import { TuiButton, TuiDialogContext } from '@taiga-ui/core'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { MappedDomain } from './domain.service'
import { injectContext, PolymorpheusComponent } from '@taiga-ui/polymorpheus'
import { TableComponent } from 'src/app/routes/portal/components/table.component'

@Component({
  selector: 'dns',
  template: `
    <section class="g-card">
      <header>{{ $any('Using IP') | i18n }}</header>

      @let subdomain = context.data.subdomain;
      @let wanIp = context.data.gateway.ipInfo?.wanIp || ('Error' | i18n);

      <table [appTable]="['Type', $any('Host'), 'Value', 'Purpose']">
        <tr>
          <td>A</td>
          <td>{{ subdomain || '@' }}</td>
          <td>{{ wanIp }}</td>
          <td></td>
        </tr>
        <tr>
          <td>A</td>
          <td>{{ subdomain ? '*.' + subdomain : '*' }}</td>
          <td>{{ wanIp }}</td>
          <td></td>
        </tr>
      </table>
    </section>

    @if (context.data.gateway.ipInfo?.deviceType !== 'wireguard') {
      <section class="g-card">
        <header>{{ $any('Using Dynamic DNS') | i18n }}</header>
        <table [appTable]="['Type', $any('Host'), 'Value', 'Purpose']">
          <tr>
            <td>ALIAS</td>
            <td>{{ subdomain || '@' }}</td>
            <td>[Dynamic DNS Address]</td>
            <td></td>
          </tr>
          <tr>
            <td>ALIAS</td>
            <td>{{ subdomain ? '*.' + subdomain : '*' }}</td>
            <td>[Dynamic DNS Address]</td>
            <td></td>
          </tr>
        </table>
      </section>
    }

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

  readonly context = injectContext<TuiDialogContext<void, MappedDomain>>()

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
}

export const DNS = new PolymorpheusComponent(DnsComponent)

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { i18nPipe } from '@start9labs/shared'
import { T } from '@start9labs/start-sdk'
import { TuiButton, TuiTitle } from '@taiga-ui/core'
import { TuiHeader } from '@taiga-ui/layout'
import { PatchDB } from 'patch-db-client'
import { map } from 'rxjs'
import { InterfaceComponent } from 'src/app/routes/portal/components/interfaces/interface.component'
import { getAddresses } from 'src/app/routes/portal/components/interfaces/interface.utils'
import { ConfigService } from 'src/app/services/config.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { TitleDirective } from 'src/app/services/title.service'

@Component({
  template: `
    <ng-container *title>
      <a routerLink=".." tuiIconButton iconStart="@tui.arrow-left">
        {{ 'Back' | i18n }}
      </a>
      {{ iface.name }}
    </ng-container>
    <header tuiHeader>
      <hgroup tuiTitle>
        <h3>
          {{ iface.name }}
        </h3>
        <p tuiSubtitle>{{ iface.description }}</p>
      </hgroup>
    </header>
    @if (ui(); as ui) {
      <service-interface [value]="ui" [isRunning]="true" />
    }
  `,
  host: { class: 'g-subpage' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InterfaceComponent,
    RouterLink,
    TuiButton,
    TitleDirective,
    TuiHeader,
    TuiTitle,
    i18nPipe,
  ],
})
export default class StartOsUiComponent {
  private readonly config = inject(ConfigService)
  private readonly i18n = inject(i18nPipe)

  readonly iface: T.ServiceInterface = {
    id: '',
    name: 'StartOS UI',
    description: this.i18n.transform(
      'The web user interface for your StartOS server, accessible from any browser.',
    )!,
    type: 'ui' as const,
    masked: false,
    addressInfo: {
      hostId: 'startos-ui',
      internalPort: 80,
      scheme: 'http',
      sslScheme: 'https',
      suffix: '',
      username: null,
    },
  }

  readonly ui = toSignal(
    inject<PatchDB<DataModel>>(PatchDB)
      .watch$('serverInfo', 'network', 'host')
      .pipe(
        map(host => {
          return {
            ...this.iface,
            addresses: getAddresses(this.iface, host, this.config),
            gateways: [],
            torDomains: [],
            clearnetDomains: [],
          }
        }),
      ),
  )
}

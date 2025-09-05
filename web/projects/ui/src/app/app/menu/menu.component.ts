import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { PatchDB } from '../../services/patch-db/patch-db.service'
import {
  combineLatest,
  filter,
  first,
  map,
  merge,
  Observable,
  of,
  pairwise,
  startWith,
  switchMap,
} from 'rxjs'
import { AbstractMarketplaceService } from '@start9labs/marketplace'
import { MarketplaceService } from 'src/app/services/marketplace.service'
import { DataModel, UIStore } from '../../services/patch-db/data-model'
import { SplitPaneTracker } from 'src/app/services/split-pane.service'
import { Emver, THEME } from '@start9labs/shared'
import { ConnectionService } from 'src/app/services/connection.service'
import { ConfigService } from 'src/app/services/config.service'
import { DidStateService } from 'src/app/services/did-state.service'
import { EOSService } from 'src/app/services/eos.service'

@Component({
  selector: 'app-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  readonly pages = [
    {
      title: 'Services',
      url: '/services',
      icon: 'grid-outline',
    },
    {
      title: 'Marketplace',
      url: '/marketplace',
      icon: 'storefront-outline',
    },
    {
      title: 'Updates',
      url: '/updates',
      icon: 'globe-outline',
    },
    {
      title: 'Notifications',
      url: '/notifications',
      icon: 'notifications-outline',
    },
    {
      title: 'System',
      url: '/system',
      icon: 'construct-outline',
    },
  ]

  readonly notificationCount$ = this.patch.watch$(
    'server-info',
    'unread-notification-count',
  )

  readonly snekScore$ = this.patch.watch$('ui', 'gaming', 'snake', 'high-score')

  readonly showEOSUpdate$ = this.eosService.showUpdate$

  private readonly local$ = this.connectionService.connected$.pipe(
    filter(Boolean),
    switchMap(() => this.patch.watch$('package-data').pipe(first())),
    switchMap(outer =>
      this.patch.watch$('package-data').pipe(
        pairwise(),
        filter(([prev, curr]) => {
          const prevValues: any[] = Object.values(prev as any)
          return prevValues.some(
            (p: any) => p?.['install-progress'] && !curr?.[p?.manifest?.id]?.['install-progress'],
          )
        }),
        map(([_, curr]) => curr),
        startWith(outer),
      ),
    ),
  )

  readonly updateCount$: Observable<number> = combineLatest([
    this.marketplaceService.getMarketplace$(),
    this.local$,
  ]).pipe(
    map(([marketplace, local]) =>
      Object.entries(marketplace).reduce((list, [_, store]) => {
        store?.packages.forEach(({ manifest: { id, version } }) => {
          if (
            this.emver.compare(
              version,
              local[id]?.installed?.manifest.version || '',
            ) === 1
          )
            list.add(id)
        })
        return list
      }, new Set<string>()),
    ),
    map(list => list.size),
  )

  readonly sidebarOpen$ = this.splitPane.sidebarOpen$

  readonly theme$ = inject(THEME)
  readonly did$ = this.didState.did$


  readonly warning$ = merge(
    of(this.config.isTorHttp()),
    this.patch.watch$('server-info', 'ntp-synced').pipe(map(synced => !synced)),
  )

  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly eosService: EOSService,
    private readonly marketplaceService: AbstractMarketplaceService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly splitPane: SplitPaneTracker,
    private readonly emver: Emver,
    private readonly connectionService: ConnectionService,
    private readonly config: ConfigService,
    private readonly didState: DidStateService,
  ) {}

  copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => {})
  }
}

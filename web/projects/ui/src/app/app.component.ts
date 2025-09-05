import { Component, inject, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { take } from 'rxjs/operators'
import { combineLatest, map, merge, startWith } from 'rxjs'
import { AuthService } from './services/auth.service'
import { SplitPaneTracker } from './services/split-pane.service'
import { PatchDataService } from './services/patch-data.service'
import { PatchMonitorService } from './services/patch-monitor.service'
import { ConnectionService } from './services/connection.service'
import { Title } from '@angular/platform-browser'
import {
  ClientStorageService,
  WidgetDrawer,
} from './services/client-storage.service'
import { ThemeSwitcherService } from './services/theme-switcher.service'
import { THEME } from '@start9labs/shared'
import { PatchDB } from './services/patch-db/patch-db.service'
import { DataModel } from './services/patch-db/data-model'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  showSplash = true
  alienIntroComplete = false
  fadeAlienIntro = false
  showWelcome = false
  fadeWelcome = false
  showLine1 = false
  showLine2 = false
  showLine3 = false
  showLine4 = false
  typingLine1 = false
  typingLine2 = false
  typingLine3 = false
  typingLine4 = false
  cursorLine1 = false
  cursorLine2 = false
  cursorLine3 = false
  cursorLine4 = false
  readonly subscription = merge(this.patchData, this.patchMonitor).subscribe()
  readonly sidebarOpen$ = this.splitPane.sidebarOpen$
  readonly widgetDrawer$ = this.clientStorageService.widgetDrawer$
  readonly theme$ = inject(THEME)
  readonly offline$ = combineLatest([
    this.authService.isVerified$,
    this.connection.connected$,
    this.patch
      .watch$('server-info', 'status-info')
      .pipe(startWith({ restarting: false, 'shutting-down': false })),
  ]).pipe(
    map(
      ([verified, connected, status]) =>
        verified &&
        (!connected || status.restarting || status['shutting-down']),
    ),
  )

  constructor(
    private readonly titleService: Title,
    private readonly patchData: PatchDataService,
    private readonly patchMonitor: PatchMonitorService,
    private readonly splitPane: SplitPaneTracker,
    private readonly patch: PatchDB<DataModel>,
    readonly authService: AuthService,
    readonly connection: ConnectionService,
    readonly clientStorageService: ClientStorageService,
    readonly themeSwitcher: ThemeSwitcherService,
    private readonly router: Router,
  ) {}

  async ngOnInit() {
    this.patch
      .watch$('ui', 'name')
      .subscribe(name => this.titleService.setTitle(name || 'Neode'))

    // Start the alien intro sequence
    this.startAlienIntro()

    // Original splash timing - now extended to accommodate intro
    setTimeout(() => {
      this.showSplash = false
      document.body.classList.add('splash-complete')
      this.authService.isVerified$.pipe(take(1)).subscribe(verified => {
        if (!verified) {
          const currentUrl = this.router.url || ''
          if (currentUrl.startsWith('/login') || currentUrl.startsWith('/setup')) return
          const config = require('../../../../config.json')
          if (config.enableDidFlow) {
            this.router.navigate(['/setup'], { replaceUrl: true })
          } else {
            this.router.navigate(['/login'], { replaceUrl: true })
          }
        }
      })
    }, 20000) // Shortened to 20s
  }

  private startAlienIntro() {
    // Start first line immediately
    setTimeout(() => {
      this.showLine1 = true
      this.typingLine1 = true
    }, 500)

    // Start second line after first completes (4s typing + 1s pause)
    setTimeout(() => {
      this.typingLine1 = false
      this.showLine2 = true
      this.typingLine2 = true
    }, 4500) // Shortened

    // Start third line after second completes (4s typing + 1s pause)
    setTimeout(() => {
      this.typingLine2 = false
      this.showLine3 = true
      this.typingLine3 = true
    }, 9000) // Shortened

    // Start fourth line after third completes (4s typing + 1s pause)
    setTimeout(() => {
      this.typingLine3 = false
      this.showLine4 = true
      this.typingLine4 = true
    }, 13500) // Shortened

    // Fade out alien intro
    setTimeout(() => {
      this.typingLine4 = false
      this.fadeAlienIntro = true
    }, 16000) // Shortened and changed to fade

    // Show welcome message
    setTimeout(() => {
      this.alienIntroComplete = true
      this.showWelcome = true
    }, 16800)

    // Fade out welcome message
    setTimeout(() => {
      this.fadeWelcome = true
    }, 19000)
  }

  splitPaneVisible({ detail }: any) {
    this.splitPane.sidebarOpen$.next(detail.visible)
  }

  onResize(drawer: WidgetDrawer) {
    this.clientStorageService.updateWidgetDrawer({
      ...drawer,
      width: drawer.width === 400 ? 600 : 400,
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}

import { Component, inject, OnDestroy } from '@angular/core'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { filter, take } from 'rxjs/operators'
import { combineLatest, map, startWith, Subscription } from 'rxjs'
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
  typingWelcome = false
  showLogo = false
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
  private readonly subscriptions = new Subscription()
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
    private readonly route: ActivatedRoute,
  ) {
    // CRITICAL: Check route IMMEDIATELY in constructor to prevent blank screen on refresh
    // This runs before ngOnInit and before the template is rendered
    const currentUrl = this.router.url || ''
    const isOnboardingRoute = currentUrl.startsWith('/onboarding') || 
                              currentUrl.startsWith('/login') || 
                              currentUrl.startsWith('/setup')
    
    if (isOnboardingRoute) {
      this.showSplash = false
      document.body.classList.add('splash-complete')
    }
  }

  async ngOnInit() {
    // Initialize auth first so streams emit immediately
    this.authService.init?.()

    const seenIntro = localStorage.getItem('neode_intro_seen') === '1'
    const forceIntro = this.router.url.startsWith('/intro')
    const currentUrl = this.router.url || ''
    
    // CRITICAL: If we're on an onboarding/login/setup page, ALWAYS skip splash immediately
    // This prevents blank screens on refresh
    const isOnboardingRoute = currentUrl.startsWith('/onboarding') || 
                              currentUrl.startsWith('/login') || 
                              currentUrl.startsWith('/setup')
    
    if (isOnboardingRoute) {
      this.showSplash = false
      document.body.classList.add('splash-complete')
      // Don't run any other splash logic
      this.initializeApp()
      return
    }

    // Force-play intro regardless of seen/verified
    if (forceIntro) {
      this.playIntroNow()
      return
    }
    
    this.authService.isVerified$.pipe(take(1)).subscribe(verified => {
      if (verified || seenIntro) {
        // Just hide splash, don't force navigation
        this.showSplash = false
        document.body.classList.add('splash-complete')
      } else {
        // Play intro for first-time users
        this.startAlienIntro()
        setTimeout(() => {
          this.showSplash = false
          localStorage.setItem('neode_intro_seen', '1')
          document.body.classList.add('splash-complete')
          
          // Only navigate if we're at root or a protected route
          const currentUrl = this.router.url || ''
          if (currentUrl === '/' || currentUrl === '') {
            this.router.navigate(['/onboarding/intro'], { replaceUrl: true })
          }
        }, 23200)
      }
    })
    
    this.initializeApp()
  }
  
  private initializeApp() {
    
    // Ensure client storage streams emit initial values so template can render
    this.clientStorageService.init()

    // CRITICAL: Start background streams ONLY when authenticated
    // These services depend on PatchDB which is only initialized after authentication
    // Subscribing before authentication causes: "You provided an invalid object where a stream was expected"
    // Services that extend Observable and use patch.watch$():
    //   - PatchDataService: watches connection and patch data
    //   - PatchMonitorService: starts/stops PatchDB based on auth state
    //   - NotificationsToastService: watches notification count
    //   - UpdateToastService: watches for system updates
    this.authService.isVerified$
      .pipe(
        filter(verified => verified),
        take(1),
      )
      .subscribe(() => {
        // Safe to subscribe now - user is authenticated and PatchDB is ready
        this.subscriptions.add((this.patchData as any).subscribe?.() ?? new Subscription())
        this.subscriptions.add((this.patchMonitor as any).subscribe?.() ?? new Subscription())

        // Watch for UI name changes
        this.patch
          .watch$('ui', 'name')
          .subscribe(name => this.titleService.setTitle(name || 'Neode'))
      })

    // Allow replaying intro on-demand by navigating to /intro
    this.subscriptions.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => {
          const url: string = e.urlAfterRedirects || e.url || ''
          if (url.startsWith('/intro')) {
            this.playIntroNow()
          }
        }),
    )
    // Timers and intro are now scheduled in the verified/seensIntro branch above
  }

  private playIntroNow() {
    // reset intro states
    this.showLine1 = this.showLine2 = this.showLine3 = this.showLine4 = false
    this.typingLine1 = this.typingLine2 = this.typingLine3 = this.typingLine4 = false
    this.alienIntroComplete = false
    this.fadeAlienIntro = false
    this.showWelcome = false
    this.fadeWelcome = false
    this.typingWelcome = false
    this.showLogo = false
    this.showSplash = true
    document.body.classList.remove('splash-complete')

    this.startAlienIntro()

    setTimeout(() => {
      this.showSplash = false
      document.body.classList.add('bg-glitch')
      localStorage.setItem('neode_intro_seen', '1')
      document.body.classList.add('splash-complete')
      // Don't force navigation - let the user stay where they navigated
      setTimeout(() => document.body.classList.remove('bg-glitch'), 900)
    }, 23200)
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

    // Show welcome message with typing
    setTimeout(() => {
      this.alienIntroComplete = true
      this.showWelcome = true
      this.typingWelcome = true
    }, 16800)

    // Fade out welcome message and then show logo for exactly 3s
    setTimeout(() => {
      this.fadeWelcome = true
      this.typingWelcome = false
    }, 19000)

    // Show logo after welcome fully hidden
    setTimeout(() => {
      this.showWelcome = false
      this.showLogo = true
    }, 19800)

    // Hide logo after 3 seconds, then allow splash to close on the global timer
    setTimeout(() => {
      this.showLogo = false
    }, 22800)
  }

  splitPaneVisible({ detail }: any) {
    this.splitPane.sidebarOpen$.next(detail.visible)
  }

  skipIntro() {
    // Immediately complete the alien intro
    this.alienIntroComplete = true
    
    // Stop all typing animations
    this.typingLine1 = false
    this.typingLine2 = false
    this.typingLine3 = false
    this.typingLine4 = false
    
    // Show all lines instantly
    this.showLine1 = true
    this.showLine2 = true
    this.showLine3 = true
    this.showLine4 = true
  }

  onResize(drawer: WidgetDrawer) {
    this.clientStorageService.updateWidgetDrawer({
      ...drawer,
      width: drawer.width === 400 ? 600 : 400,
    })
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe()
  }
}

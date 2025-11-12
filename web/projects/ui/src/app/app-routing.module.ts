import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './guards/auth.guard'
import { UnauthGuard } from './guards/unauth.guard'
import { IdentityFeatureGuard } from './guards/identity-feature.guard'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'onboarding/intro',
  },
  {
    path: 'onboarding/intro',
    canActivate: [UnauthGuard],
    loadChildren: () =>
      import(
        './pages/onboarding/onboarding-intro/onboarding-intro.module'
      ).then(m => m.OnboardingIntroPageModule),
  },
  {
    path: 'onboarding/options',
    canActivate: [UnauthGuard],
    loadChildren: () =>
      import(
        './pages/onboarding/onboarding-options/onboarding-options.module'
      ).then(m => m.OnboardingOptionsPageModule),
  },
  {
    path: 'intro',
    loadChildren: () =>
      import('./pages/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'login',
    canActivate: [UnauthGuard],
    loadChildren: () =>
      import('./pages/login/login.module').then(m => m.LoginPageModule),
  },

  {
    path: 'setup',
    canActivate: [UnauthGuard, IdentityFeatureGuard],
    loadChildren: () =>
      import('./pages/identity/identity.module').then(m => m.IdentityModule),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'system',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () =>
      import('./pages/server-routes/server-routing.module').then(
        m => m.ServerRoutingModule,
      ),
  },
  {
    path: 'updates',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () =>
      import('./pages/updates/updates.module').then(m => m.UpdatesPageModule),
  },
  {
    path: 'marketplace',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () =>
      import('./pages/marketplace-routes/marketplace-routing.module').then(
        m => m.MarketplaceRoutingModule,
      ),
  },
  {
    path: 'notifications',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/notifications/notifications.module').then(
        m => m.NotificationsPageModule,
      ),
  },
  {
    path: 'services',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () =>
      import('./pages/apps-routes/apps-routing.module').then(
        m => m.AppsRoutingModule,
      ),
  },
  {
    path: 'developer',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () =>
      import('./pages/developer-routes/developer-routing.module').then(
        m => m.DeveloperRoutingModule,
      ),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      preloadingStrategy: PreloadAllModules,
      initialNavigation: 'disabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

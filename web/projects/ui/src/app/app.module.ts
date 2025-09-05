import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import {
  TUI_SANITIZER,
  TuiDialogModule,
  TuiModeModule,
  TuiRootModule,
  TuiThemeNightModule,
} from '@taiga-ui/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { TuiMobileDialogModule } from '@taiga-ui/addon-mobile'
import { TuiLetModule } from '@taiga-ui/cdk'
import { MarketplaceModule } from './pages/marketplace-routes/marketplace.module'
import { PreloadAllModules } from '@angular/router'
import { MenuModule } from './app/menu/menu.module'
import { APP_PROVIDERS } from './app.providers'
import { PatchDbModule } from './services/patch-db/patch-db.module'
import { ToastContainerModule } from './components/toast-container/toast-container.module'
import { ConnectionBarComponentModule } from './components/connection-bar/connection-bar.component.module'
import { WidgetsPageModule } from './pages/widgets/widgets.module'
import { ServiceWorkerModule } from '@angular/service-worker'
import { environment } from '../environments/environment'
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify'

@NgModule({
  declarations: [AppComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TuiRootModule,
    TuiDialogModule,
    TuiMobileDialogModule,
    TuiLetModule,
    TuiModeModule,
    TuiThemeNightModule,
    MenuModule,
    IonicModule.forRoot({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false,
    }),
    MarketplaceModule.forRoot(),
    PatchDbModule,
    ToastContainerModule,
    ConnectionBarComponentModule,
    WidgetsPageModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
    {
      provide: TUI_SANITIZER,
      useClass: NgDompurifySanitizer,
    },
    ...APP_PROVIDERS,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import {
  TUI_SANITIZER,
  TuiDialogModule,
  TuiModeModule,
  TuiRootModule,
  TuiThemeNightModule,
  TuiNotificationModule,
} from '@taiga-ui/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { HttpClientModule } from '@angular/common/http'
import { CommonModule } from '@angular/common'

import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { TuiLetModule } from '@taiga-ui/cdk'
import { MenuModule } from './app/menu/menu.module'
import { GenericInputComponentModule } from './modals/generic-input/generic-input.component.module'
import { OSWelcomePageModule } from './modals/os-welcome/os-welcome.module'
import { APP_PROVIDERS } from './app.providers'
import { PatchDbModule } from './services/patch-db/patch-db.module'
import { ToastContainerModule } from './components/toast-container/toast-container.module'
import { ConnectionBarComponentModule } from './components/connection-bar/connection-bar.component.module'
import { WidgetsPageModule } from './pages/widgets/widgets.module'
import { ServiceWorkerModule } from '@angular/service-worker'
import { environment } from '../environments/environment'
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify'
import {
  DarkThemeModule,
  EnterModule,
  LightThemeModule,
  SharedPipesModule,
} from '@start9labs/shared'

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TuiRootModule,
    TuiDialogModule,
    TuiLetModule,
    TuiModeModule,
    TuiThemeNightModule,
    TuiNotificationModule,
    MenuModule,
    IonicModule.forRoot({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false,
    }),
    PatchDbModule,
    ToastContainerModule,
    ConnectionBarComponentModule,
    GenericInputComponentModule,
    OSWelcomePageModule,
    WidgetsPageModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    DarkThemeModule,
    EnterModule,
    LightThemeModule,
    SharedPipesModule,
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

import { Inject, Injectable } from '@angular/core'
import { WINDOW } from '@ng-web-apis/common'
import { PackageDataEntry } from 'src/app/services/patch-db/data-model'
import { ConfigService } from './config.service'

@Injectable({
  providedIn: 'root',
})
export class UiLauncherService {
  constructor(
    @Inject(WINDOW) private readonly windowRef: Window,
    private readonly config: ConfigService,
  ) {}

  launch(pkg: PackageDataEntry): void {
    if ((pkg as any)?.installed?.manifest?.id === 'atob' || (pkg as any)?.manifest?.id === 'atob') {
      this.windowRef.open('https://app.atobitcoin.io', '_blank', 'noopener,noreferrer')
      return
    }
    this.windowRef.open(this.config.launchableURL(pkg), '_blank', 'noreferrer')
  }
}

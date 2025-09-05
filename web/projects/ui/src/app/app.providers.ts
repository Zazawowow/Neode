import { Provider } from '@angular/core'
import { ConfigService } from './services/config.service'
import { PatchDataService } from './services/patch-data.service'
import { SplitPaneTracker } from './services/split-pane.service'
import { PatchMonitorService } from './services/patch-monitor.service'
import { ConnectionService } from './services/connection.service'
import { ClientStorageService } from './services/client-storage.service'
import { ThemeSwitcherService } from './services/theme-switcher.service'
import { TimeService } from './services/time.service'
import { DepErrorService } from './services/dep-error.service'
import { EOSService } from './services/eos.service'
import { TuiAlertService } from '@taiga-ui/core'
import { getEmbassyApiProvider } from './services/api/embassy-api.provider'

const { useMocks } = require('../../../../config.json')

export const APP_PROVIDERS: Provider[] = [
  ConfigService,
  PatchDataService,
  SplitPaneTracker,
  PatchMonitorService,
  ClientStorageService,
  ConnectionService,
  ThemeSwitcherService,
  TimeService,
  DepErrorService,
  EOSService,
  TuiAlertService,
  ...getEmbassyApiProvider(useMocks),
]

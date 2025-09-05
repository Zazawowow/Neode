import { Provider } from '@angular/core'
import { ConfigService } from './config.service'
import { PatchDataService } from './patch-data.service'
import { SplitPaneTracker } from './split-pane.service'
import { PatchMonitorService } from './patch-monitor.service'
import { ConnectionService } from './connection.service'
import { ClientStorageService } from './client-storage.service'
import { ThemeSwitcherService } from './theme-switcher.service'
import { PwaService } from './pwa.service'
import { TimeService } from './time-service'
import { DepErrorService } from './dep-error.service'
import { EOSService } from './eos.service'
import { TuiAlertService } from '@taiga-ui/core'
import { getEmbassyApiProvider } from './api/embassy-api.provider'

const { useMocks } = require('../../../../config.json')

export const APP_PROVIDERS: Provider[] = [
  ConfigService,
  PatchDataService,
  SplitPaneTracker,
  PatchMonitorService,
  ClientStorageService,
  ConnectionService,
  ThemeSwitcherService,
  PwaService,
  TimeService,
  DepErrorService,
  EOSService,
  TuiAlertService,
  ...getEmbassyApiProvider(useMocks),
]

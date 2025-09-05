import { Provider } from '@angular/core'
import { PatchDB } from '../patch-db/patch-db.service'
import { MockPatchDB } from '../mock-patch-db.service'
import { ApiService } from './embassy-api.service'
import { LiveApiService } from './embassy-live-api.service'
import { MockApiService } from './embassy-mock-api.service'

export function getEmbassyApiProvider(useMocks: boolean): Provider[] {
  return useMocks
    ? [
        {
          provide: ApiService,
          useClass: MockApiService,
        },
        {
          provide: PatchDB,
          useClass: MockPatchDB,
        },
      ]
    : [
        {
          provide: ApiService,
          useClass: LiveApiService,
        },
      ]
}

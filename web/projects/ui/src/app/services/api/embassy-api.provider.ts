import { Provider } from '@angular/core'
import { PatchDB } from './patch-db/patch-db.service'
import { MockPatchDB } from './mock-patch-db.service'
import { ApiService } from './api/embassy-api.service'
import { LiveApiService } from './api/embassy-live-api.service'
import { MockApiService } from './api/embassy-mock-api.service'

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

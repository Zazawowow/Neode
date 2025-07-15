import { StaticClassProvider } from '@angular/core'
import {
  bufferTime,
  catchError,
  defer,
  delay,
  filter,
  map,
  Observable,
  repeatWhen,
  scan,
  switchMap,
  timer,
} from 'rxjs'
import { FollowLogsReq, FollowLogsRes, Log } from '../types/api'
import { Constructor } from '../types/constructor'
import { convertAnsi } from '../util/convert-ansi'

interface Api {
  initFollowLogs: (params: FollowLogsReq) => Promise<FollowLogsRes>
  openWebsocket$: (guid: string) => Observable<Log>
}

export function provideSetupLogsService(
  api: Constructor<Api>,
): StaticClassProvider {
  return {
    provide: SetupLogsService,
    deps: [api],
    useClass: SetupLogsService,
  }
}

export class SetupLogsService extends Observable<readonly string[]> {
  private readonly log$ = defer(() => this.api.initFollowLogs({})).pipe(
    switchMap(({ guid }) => this.api.openWebsocket$(guid)),
    bufferTime(500),
    filter(logs => !!logs.length),
    map(convertAnsi),
    scan((logs: readonly string[], log) => [...logs, log], []),
    repeatWhen(obs => obs.pipe(delay(2000))),
    catchError((_, watch$) => timer(2000).pipe(switchMap(() => watch$))),
  )

  constructor(private readonly api: Api) {
    super(subscriber => this.log$.subscribe(subscriber))
  }
}

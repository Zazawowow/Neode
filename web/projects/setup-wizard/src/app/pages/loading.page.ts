import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import {
  formatProgress,
  getErrorMessage,
  InitializingComponent,
} from '@start9labs/shared'
import { T } from '@start9labs/start-sdk'
import {
  catchError,
  filter,
  from,
  map,
  startWith,
  switchMap,
  tap,
  timer,
} from 'rxjs'
import { ApiService } from 'src/app/services/api.service'
import { StateService } from 'src/app/services/state.service'

@Component({
  template:
    '<app-initializing [setupType]="type" [progress]="progress()" [error]="error()" />',
  styles: `
    :host {
      max-width: unset;
      align-items: stretch;
    }
  `,
  imports: [InitializingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoadingPage {
  private readonly api = inject(ApiService)

  readonly type = inject(StateService).setupType
  readonly router = inject(Router)
  readonly progress = toSignal(
    from(this.getStatus()).pipe(
      filter(Boolean),
      switchMap(({ guid, progress }) =>
        this.api.openWebsocket$<T.FullProgress>(guid).pipe(
          startWith(progress),
          tap(({ overall }) => {
            if (overall === true) {
              this.getStatus()
            }
          }),
        ),
      ),
      map(formatProgress),
      catchError((_, caught$) => timer(500).pipe(switchMap(() => caught$))),
    ),
    { initialValue: { total: 0, message: '' } },
  )

  error = signal('')

  private async getStatus(): Promise<{
    status: 'running'
    guid: string
    progress: T.FullProgress
  } | null> {
    try {
      const res = await this.api.getStatus()

      if (!res) {
        this.router.navigate(['home'])
      } else if (res.status === 'complete') {
        this.router.navigate(['success'])
      } else {
        return res
      }
    } catch (e: any) {
      this.error.set(getErrorMessage(e))
    }

    return null
  }
}

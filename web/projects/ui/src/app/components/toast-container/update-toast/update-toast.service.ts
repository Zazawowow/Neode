import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { TuiAlertService, TuiNotification } from '@taiga-ui/core'
import { from, EMPTY, Observable, Subject } from 'rxjs'
import { exhaustMap, filter, take, tap, catchError, delay } from 'rxjs/operators'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { AuthService } from 'src/app/services/auth.service'

@Injectable({ providedIn: 'root' })
export class UpdateToastService extends Observable<boolean> {
  private readonly updateSubject$ = new Subject<boolean>()
  
  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly alertService: TuiAlertService,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {
    // Pass the subject as the Observable source
    super(subscriber => this.updateSubject$.subscribe(subscriber))
    
    // CRITICAL: Only subscribe when authenticated
    // PatchDB is not initialized during onboarding, so we must wait for auth
    // This prevents: "You provided an invalid object where a stream was expected"
    this.auth.isVerified$
      .pipe(
        filter(verified => verified),
        take(1),
        delay(1000), // Give PatchDB time to initialize
        exhaustMap(() =>
          this.patch
            .watch$('server-info', 'status-info', 'updated')
            .pipe(
              filter(Boolean),
              exhaustMap(() => {
                const result = this.alertService.open('System has been updated', {
                  label: 'Click to reload the page',
                  status: 'info' as TuiNotification,
                  autoClose: false,
                })
                // Handle both Observable and PolymorpheusContent return types
                return typeof result === 'object' && result && 'subscribe' in result 
                  ? result 
                  : from(Promise.resolve(result))
              }),
              filter(() => true),
              take(1),
              tap(() => {
                this.updateSubject$.next(true)
                window.location.reload()
              }),
              catchError(() => EMPTY)
            )
        )
      )
      .subscribe()
  }
}

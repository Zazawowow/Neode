import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { TuiAlertService, TuiNotification } from '@taiga-ui/core'
import { from, EMPTY, Observable, Subject } from 'rxjs'
import { exhaustMap, filter, take, tap, pairwise, map, endWith, catchError, delay, share } from 'rxjs/operators'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { AuthService } from 'src/app/services/auth.service'

@Injectable({ providedIn: 'root' })
export class NotificationsToastService extends Observable<boolean> {
  private readonly notificationSubject$ = new Subject<boolean>()
  
  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly alertService: TuiAlertService,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {
    // Pass the subject as the Observable source
    super(subscriber => this.notificationSubject$.subscribe(subscriber))
    
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
            .watch$('server-info', 'unread-notification-count')
            .pipe(
              pairwise(),
              map(([prev, cur]) => cur > prev),
              filter(Boolean),
              exhaustMap(() => {
                const result = this.alertService.open('New notifications', {
                  label: 'You have new notifications',
                  status: 'info' as TuiNotification,
                  autoClose: 6000,
                })
                // Handle both Observable and PolymorpheusContent return types
                return typeof result === 'object' && result && 'subscribe' in result 
                  ? result 
                  : from(Promise.resolve(result))
              }),
              filter(() => true),
              take(1),
              tap(() => {
                this.notificationSubject$.next(true)
                this.router.navigate(['/notifications'])
              }),
              catchError(() => EMPTY)
            )
        )
      )
      .subscribe()
  }
}

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { TuiAlertService, TuiNotification } from '@taiga-ui/core'
import { from, Subject } from 'rxjs'
import { exhaustMap, filter, take, tap, pairwise, map, endWith } from 'rxjs/operators'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'

@Injectable({ providedIn: 'root' })
export class NotificationsToastService {
  private readonly stream$ = this.patch
    .watch$('server-info', 'unread-notification-count')
    .pipe(
      pairwise(),
      map(([prev, cur]) => cur > prev),
      endWith(false),
      filter(Boolean),
    )

  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly alertService: TuiAlertService,
    private readonly router: Router,
  ) {
    this.stream$
      .pipe(
        exhaustMap(() =>
          from(
            this.alertService.open('New notifications', {
              label: 'You have new notifications',
              status: 'info' as TuiNotification,
              autoClose: 6000,
            }),
          ),
        ),
        filter(() => true),
        take(1),
        tap(() => this.router.navigate(['/notifications'])),
      )
      .subscribe()
  }
}

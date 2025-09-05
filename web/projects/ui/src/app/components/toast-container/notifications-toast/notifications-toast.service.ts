import { Injectable } from '@angular/core'
import { TuiAlertService } from '@taiga-ui/core'
import { from, Subject } from 'rxjs'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import {
  exhaustMap,
  filter,
  pairwise,
  switchMap,
  take,
  tap,
  map,
  endWith,
} from 'rxjs/operators'
import { Router } from '@angular/router'

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
              status: 'info',
              autoClose: 6000,
            }),
          ),
        ),
        filter(res => res === 'click'),
        take(1),
        tap(() => this.router.navigate(['/notifications'])),
      )
      .subscribe()
  }
}

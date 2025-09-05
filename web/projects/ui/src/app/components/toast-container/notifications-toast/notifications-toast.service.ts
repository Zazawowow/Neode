import { Injectable } from '@angular/core'
import { TuiAlertService } from '@taiga-ui/core'
import { from, Subject } from 'rxjs'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { exhaustMap, filter, switchMap, take, tap } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class NotificationsToastService extends Subject<boolean> {
  private readonly stream$ = this.patch
    .watch$('server-info', 'unread-notification-count')
    .pipe(
      pairwise(),
      map(([prev, cur]) => cur > prev),
      endWith(false),
    )

  constructor(private readonly patch: PatchDB<DataModel>) {
    super(subscriber => this.stream$.subscribe(subscriber))
  }
}

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { TuiAlertService, TuiNotification } from '@taiga-ui/core'
import { from } from 'rxjs'
import { exhaustMap, filter, take, tap } from 'rxjs/operators'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'

@Injectable({ providedIn: 'root' })
export class UpdateToastService {
  private readonly stream$ = this.patch
    .watch$('server-info', 'status-info', 'updated')
    .pipe(filter(Boolean))

  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly alertService: TuiAlertService,
    private readonly router: Router,
  ) {
    this.stream$
      .pipe(
        exhaustMap(() =>
          from(
            this.alertService.open('System has been updated', {
              label: 'Click to reload the page',
              status: 'info' as TuiNotification,
              autoClose: false,
            }),
          ),
        ),
        filter(res => !!res),
        take(1),
        tap(() => window.location.reload()),
      )
      .subscribe()
  }
}

import { Injectable } from '@angular/core'
import { TuiAlertService } from '@taiga-ui/core'
import { from, Subject } from 'rxjs'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { exhaustMap, filter, take, tap } from 'rxjs/operators'
import { Router } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class UpdateToastService extends Subject<boolean> {
  private readonly stream$ = this.patch
    .watch$('server-info', 'status-info', 'updated')
    .pipe(filter(Boolean))

  constructor(private readonly patch: PatchDB<DataModel>) {
    super()
    this.stream$.subscribe(this)
  }
}

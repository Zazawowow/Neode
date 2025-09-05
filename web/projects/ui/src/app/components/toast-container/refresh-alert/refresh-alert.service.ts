import { Injectable } from '@angular/core'
import { Emver } from '@start9labs/shared'
import { filter, map, pairwise, endWith, Observable } from 'rxjs'
import { ConfigService } from 'src/app/services/config.service'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { DataModel } from 'src/app/services/patch-db/data-model'
import { ConnectionService } from 'src/app/services/connection.service'

@Injectable({
  providedIn: 'root',
})
export class RefreshAlertService extends Observable<boolean> {
  private readonly stream$ = this.connectionService.connected$.pipe(
    pairwise(),
    filter(([prev, curr]) => !prev && curr),
    map(() => true),
    endWith(false),
  )

  constructor(private readonly connectionService: ConnectionService) {
    super(subscriber => this.stream$.subscribe(subscriber))
  }
}

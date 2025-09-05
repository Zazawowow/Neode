import { ChangeDetectionStrategy, Component, NgZone } from '@angular/core'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { combineLatest, filter, map, startWith, Observable } from 'rxjs'
import { ConnectionService } from 'src/app/services/connection.service'
import { DataModel } from 'src/app/services/patch-db/data-model'

@Component({
  selector: 'connection-bar',
  templateUrl: './connection-bar.component.html',
  styleUrls: ['./connection-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionBarComponent {
  readonly connection$ = combineLatest([
    this.connectionService.networkConnected$,
    this.connectionService.websocketConnected$,
  ]).pipe(
    map(
      ([network, websocket]) =>
        this.connectionService.connectionType({ network, websocket }),
      startWith(this.connectionService.connectionType({})),
    ),
  )

  constructor(
    private readonly patch: PatchDB<DataModel>,
    private readonly connectionService: ConnectionService,
    private readonly ngZone: NgZone,
  ) {}

  get connected() {
    return this.connectionService.connected$
  }
}

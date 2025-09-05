import { Injectable } from '@angular/core'
import { combineLatest, fromEvent, merge, ReplaySubject } from 'rxjs'
import { distinctUntilChanged, map, startWith } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  readonly networkConnected$ = merge(
    fromEvent(window, 'online'),
    fromEvent(window, 'offline'),
  ).pipe(
    startWith(null),
    map(() => navigator.onLine),
    distinctUntilChanged(),
  )
  readonly websocketConnected$ = new ReplaySubject<boolean>(1)
  readonly connected$ = combineLatest([
    this.networkConnected$,
    this.websocketConnected$.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([network, websocket]) => network && websocket),
    distinctUntilChanged(),
  )

  setNetwork(isOnline: boolean): void {
    // This method can be used by other parts of the app to manually update network status
  }

  connectionType(connections: {
    network?: boolean
    websocket?: boolean
  }): {
    message: string
    color: string
    icon: string
    dots: boolean
  } {
    const { network, websocket } = connections
    if (!network)
      return {
        message: 'No Internet',
        color: 'danger',
        icon: 'cloud-offline-outline',
        dots: false,
      }
    if (!websocket)
      return {
        message: 'Connecting',
        color: 'warning',
        icon: 'cloud-offline-outline',
        dots: true,
      }

    return {
      message: 'Connected',
      color: 'success',
      icon: 'cloud-done',
      dots: false,
    }
  }

  setWebsocket(isConnected: boolean): void {
    this.websocketConnected$.next(isConnected)
  }
}

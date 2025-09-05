import { Injectable, NgZone } from '@angular/core'
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  tap,
} from 'rxjs/operators'
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs'
import { S9Server } from 'src/app/models/s9-server'
import { isPlatform, Platform } from '@ionic/angular'

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

  constructor(private readonly ngZone: NgZone) {
    this.listen()
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

  listen(): void {
    window.addEventListener('online', () => this.setNetwork(true))
    window.addEventListener('offline', () => this.setNetwork(false))
  }
}

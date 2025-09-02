import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { StorageService } from './storage.service'

const DID_STATE_KEY = 'NEODE_DID_STATE'

export type DidState = {
  did: string
  kid: string
}

@Injectable({ providedIn: 'root' })
export class DidStateService {
  readonly did$ = new BehaviorSubject<DidState | null>(null)

  constructor(private readonly storage: StorageService) {
    const saved = this.storage.get<DidState | null>(DID_STATE_KEY)
    if (saved && saved.did && saved.kid) this.did$.next(saved)
  }

  setDid(state: DidState) {
    this.did$.next(state)
    this.storage.set(DID_STATE_KEY, state)
  }

  clear() {
    this.did$.next(null)
    // StorageService has no remove; emulate by setting null
    this.storage.set(DID_STATE_KEY, null as any)
  }
}



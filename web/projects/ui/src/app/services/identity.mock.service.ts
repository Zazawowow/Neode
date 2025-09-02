import { Injectable } from '@angular/core'

export interface CreatedDid {
  did: string
  kid: string
}

@Injectable({ providedIn: 'root' })
export class IdentityMockService {
  createDidKey(): Promise<CreatedDid> {
    const did = `did:key:z${Math.random().toString(36).slice(2)}`
    const kid = `${did}#keys-1`
    return Promise.resolve({ did, kid })
  }

  importFromBackup(text: string): Promise<CreatedDid> {
    const didMatch = text.match(/did:[^\"\s]+/)
    const did = didMatch?.[0] || `did:key:zimport${Math.random().toString(36).slice(2)}`
    const kid = `${did}#keys-1`
    return Promise.resolve({ did, kid })
  }

  exportBackup(kid: string, passphrase: string): Promise<string> {
    const mock = { kid, cipher: 'mock', data: Math.random().toString(36).slice(2) }
    return Promise.resolve(JSON.stringify(mock))
  }

  signChallenge(kid: string, challenge: string): Promise<string> {
    return Promise.resolve(`signed(${challenge})-with-${kid}`)
  }
}



import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { IdentityMockService } from 'src/app/services/identity.mock.service'
import { DidStateService } from 'src/app/services/did-state.service'

@Component({
  selector: 'identity-import',
  template: `
    <h2>Import DID</h2>
    <ion-textarea [(ngModel)]="input" placeholder="Paste JWK or backup JSON"></ion-textarea>
    <ion-button class="setup-button" (click)="validate()">Validate</ion-button>
    <div *ngIf="did">
      <p><strong>Detected DID:</strong> {{ did }}</p>
      <ion-button class="setup-button" (click)="next()">Continue</ion-button>
    </div>
  `,
})
export class IdentityImportComponent {
  input = ''
  did = ''
  kid = ''
  constructor(
    private readonly router: Router,
    private readonly identity: IdentityMockService,
    private readonly didState: DidStateService,
  ) {}
  async validate() {
    const { did, kid } = await this.identity.importFromBackup(this.input)
    this.did = did
    this.kid = kid
  }
  next() {
    if (this.did && this.kid) this.didState.setDid({ did: this.did, kid: this.kid })
    this.router.navigate(['/setup/backup'])
  }
}



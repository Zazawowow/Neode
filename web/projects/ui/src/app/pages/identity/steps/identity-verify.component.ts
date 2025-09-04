import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { IdentityMockService } from 'src/app/services/identity.mock.service'

@Component({
  selector: 'identity-verify',
  template: `
    <div class="step-header">
      <ion-button fill="clear" class="back-btn" (click)="back()">
        <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
      </ion-button>
      <h2>Verify</h2>
    </div>
    <p>Sign a mock challenge to verify your DID is usable.</p>
    <ion-button class="setup-button" (click)="sign()">Sign Challenge</ion-button>
    <div *ngIf="ok">
      <ion-icon name="checkmark-circle" color="success"></ion-icon>
      <span>Verified</span>
      <ion-button class="setup-button" (click)="next()">Finish</ion-button>
    </div>
  `,
})
export class IdentityVerifyComponent {
  ok = false
  kid = 'kid:mock'
  constructor(private readonly router: Router, private readonly identity: IdentityMockService) {}
  back() { this.router.navigate(['/setup/backup']) }
  async sign() {
    const signed = await this.identity.signChallenge(this.kid, 'challenge')
    this.ok = !!signed
  }
  next() { this.router.navigate(['/setup/done']) }
}



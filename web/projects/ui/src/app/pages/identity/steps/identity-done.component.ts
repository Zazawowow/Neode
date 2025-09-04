import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-done',
  template: `
    <div class="step-header">
      <ion-button fill="clear" class="back-btn" (click)="back()">
        <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
      </ion-button>
      <h2>All set!</h2>
    </div>
    <p>Your DID is ready. You can now log in using your device password.</p>
    <ion-button class="setup-button" routerLink="/login">Go to Login</ion-button>
  `,
})
export class IdentityDoneComponent {
  constructor(private readonly router: Router) {}
  back() { this.router.navigate(['/setup/verify']) }
}



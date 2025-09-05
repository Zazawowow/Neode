import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-welcome',
  template: `
    <div class="step-header">
      <ion-button fill="clear" class="back-btn" (click)="back()">
        <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
      </ion-button>
      <h1>Create your Decentralized ID</h1>
    </div>
    <p>
      A DID lets you control your identity and sign in without a password.
    </p>
    <ion-button class="setup-button" (click)="next()">Get Started</ion-button>
  `,
})
export class IdentityWelcomeComponent {
  constructor(private readonly router: Router) {}
  back() { this.router.navigate(['/login']) }
  next() {
    this.router.navigate(['/setup/choose'])
  }
}



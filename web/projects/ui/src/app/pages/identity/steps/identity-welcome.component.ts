import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-welcome',
  template: `
    <div class="step-header">
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
  next() {
    this.router.navigate(['/setup/choose'])
  }
}



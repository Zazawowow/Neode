import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-done',
  template: `
    <h2>All set!</h2>
    <p>Your DID is ready. You can now log in using your device password.</p>
    <ion-button class="setup-button" routerLink="/login">Go to Login</ion-button>
  `,
})
export class IdentityDoneComponent {}



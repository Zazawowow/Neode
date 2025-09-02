import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-choose',
  template: `
    <h2>Choose an option</h2>
    <div class="choices">
      <ion-card (click)="create()">
        <ion-card-header><ion-card-title>Create new DID (did:key)</ion-card-title></ion-card-header>
        <ion-card-content>Instant, offline-friendly.</ion-card-content>
      </ion-card>
      <ion-card (click)="import()">
        <ion-card-header><ion-card-title>Import existing DID</ion-card-title></ion-card-header>
        <ion-card-content>Paste or upload keys/backup.</ion-card-content>
      </ion-card>
    </div>
    <ion-button class="setup-button" (click)="create()">Continue</ion-button>
  `,
  styles: [
    `
    .choices { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 720px) { .choices { grid-template-columns: 1fr 1fr; } }
    ion-card { cursor: pointer; }
    `,
  ],
})
export class IdentityChooseComponent {
  constructor(private readonly router: Router) {}
  create() { this.router.navigate(['/setup/create']) }
  import() { this.router.navigate(['/setup/import']) }
}



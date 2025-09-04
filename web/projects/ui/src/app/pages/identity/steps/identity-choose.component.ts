import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'identity-choose',
  template: `
    <div class="step-header">
      <ion-button fill="clear" class="back-btn" (click)="back()">
        <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
      </ion-button>
      <h2>Choose an option</h2>
    </div>
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
  back() { this.router.navigate(['/setup/welcome']) }
  create() { this.router.navigate(['/setup/create']) }
  import() { this.router.navigate(['/setup/import']) }
}



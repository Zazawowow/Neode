import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { IdentityMockService } from 'src/app/services/identity.mock.service'

@Component({
  selector: 'identity-backup',
  template: `
    <div class="step-header">
      <ion-button fill="clear" class="back-btn" (click)="back()">
        <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
      </ion-button>
      <h2>Backup</h2>
    </div>
    <p>Download your encrypted backup file and set a passphrase.</p>
    <ion-item color="dark" fill="solid">
      <ion-icon
        slot="start"
        size="small"
        color="base"
        name="lock-closed-outline"
        style="margin-right: 16px"
      ></ion-icon>
      <ion-input
        [(ngModel)]="passphrase"
        type="password"
        placeholder="Passphrase"
      ></ion-input>
    </ion-item>
    <ion-button class="setup-button" (click)="download()">Download Backup</ion-button>
    <ion-button class="setup-button" [disabled]="!passphrase" (click)="next()">Continue</ion-button>
  `,
})
export class IdentityBackupComponent {
  passphrase = ''
  kid = 'kid:mock'
  constructor(private readonly router: Router, private readonly identity: IdentityMockService) {}
  back() { this.router.navigate(['/setup/choose']) }
  async download() {
    const data = await this.identity.exportBackup(this.kid, this.passphrase)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'neode-did-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  next() { this.router.navigate(['/setup/verify']) }
}



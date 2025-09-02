import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { IdentityPage } from './identity.page'
import { IdentityWelcomeComponent } from './steps/identity-welcome.component'
import { IdentityChooseComponent } from './steps/identity-choose.component'
import { IdentityCreateComponent } from './steps/identity-create.component'
import { IdentityImportComponent } from './steps/identity-import.component'
import { IdentityBackupComponent } from './steps/identity-backup.component'
import { IdentityVerifyComponent } from './steps/identity-verify.component'
import { IdentityDoneComponent } from './steps/identity-done.component'

const routes: Routes = [
  {
    path: '',
    component: IdentityPage,
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: IdentityWelcomeComponent },
      { path: 'choose', component: IdentityChooseComponent },
      { path: 'create', component: IdentityCreateComponent },
      { path: 'import', component: IdentityImportComponent },
      { path: 'backup', component: IdentityBackupComponent },
      { path: 'verify', component: IdentityVerifyComponent },
      { path: 'done', component: IdentityDoneComponent },
    ],
  },
]

@NgModule({
  declarations: [
    IdentityPage,
    IdentityWelcomeComponent,
    IdentityChooseComponent,
    IdentityCreateComponent,
    IdentityImportComponent,
    IdentityBackupComponent,
    IdentityVerifyComponent,
    IdentityDoneComponent,
  ],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class IdentityModule {}



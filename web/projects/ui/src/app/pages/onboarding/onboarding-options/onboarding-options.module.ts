import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { OnboardingOptionsPage } from './onboarding-options.page'

const routes: Routes = [
  {
    path: '',
    component: OnboardingOptionsPage,
  },
]

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [OnboardingOptionsPage],
})
export class OnboardingOptionsPageModule {}


import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { OnboardingIntroPage } from './onboarding-intro.page'

const routes: Routes = [
  {
    path: '',
    component: OnboardingIntroPage,
  },
]

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [OnboardingIntroPage],
})
export class OnboardingIntroPageModule {}


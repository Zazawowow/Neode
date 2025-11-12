import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'onboarding-intro',
  templateUrl: './onboarding-intro.page.html',
  styleUrls: ['./onboarding-intro.page.scss'],
})
export class OnboardingIntroPage {
  constructor(private readonly router: Router) {}

  startJourney() {
    this.router.navigate(['/onboarding/options'])
  }
}


import { Component } from '@angular/core'
import { Router } from '@angular/router'

interface SovereigntyOption {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
}

@Component({
  selector: 'onboarding-options',
  templateUrl: './onboarding-options.page.html',
  styleUrls: ['./onboarding-options.page.scss'],
})
export class OnboardingOptionsPage {
  options: SovereigntyOption[] = [
    {
      id: 'self-sovereignty',
      title: 'Self Sovereignty',
      description:
        'Data, files, ownership, property of my data estate. Own, manage, edit, and even sell your personal data.',
      icon: 'shield-checkmark-outline',
      enabled: false,
    },
    {
      id: 'community-commerce',
      title: 'Community Commerce',
      description:
        'Self contained and owned ecommerce system built on bitcoin and mesh networks. Trade freely without intermediaries.',
      icon: 'people-outline',
      enabled: false,
    },
    {
      id: 'sovereign-projects',
      title: 'Sovereign Projects',
      description:
        'Logistics and project management self owned with privacy control. Collaborate without surveillance.',
      icon: 'briefcase-outline',
      enabled: false,
    },
    {
      id: 'data-transmitter',
      title: 'Data Transmitter',
      description:
        'Assist the new sovereign net with relay points and networking where you get paid for your value.',
      icon: 'radio-outline',
      enabled: false,
    },
    {
      id: 'hoster',
      title: 'Hoster',
      description:
        'Host services and content, archives, and more to others for micro bitcoin payments. Earn while you serve.',
      icon: 'server-outline',
      enabled: false,
    },
    {
      id: 'sovereign-ai',
      title: 'Sovereign AI',
      description:
        'Run AI models locally on your hardware. No cloud surveillance, complete privacy, full control over your AI assistant.',
      icon: 'hardware-chip-outline',
      enabled: false,
    },
  ]

  constructor(private readonly router: Router) {}

  toggleOption(option: SovereigntyOption) {
    option.enabled = !option.enabled
  }

  back() {
    this.router.navigate(['/onboarding/intro'])
  }

  continue() {
    // Store selected options in localStorage or service
    const selectedOptions = this.options
      .filter(opt => opt.enabled)
      .map(opt => opt.id)

    localStorage.setItem(
      'neode_sovereignty_options',
      JSON.stringify(selectedOptions),
    )

    // Mark onboarding as complete
    localStorage.setItem('neode_onboarding_complete', '1')

    // Navigate to login (user will direct next screens)
    this.router.navigate(['/login'])
  }
}


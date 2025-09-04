import { Component, OnDestroy, OnInit } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter, Subscription } from 'rxjs'

@Component({
  selector: 'identity-page',
  templateUrl: './identity.page.html',
  styleUrls: ['./identity.page.scss'],
})
export class IdentityPage implements OnInit, OnDestroy {
  private sub?: Subscription
  currentUrl = ''

  constructor(private readonly router: Router) {}

  ngOnInit() {
    this.currentUrl = this.router.url
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => (this.currentUrl = e.urlAfterRedirects || e.url))
  }

  get showBack(): boolean {
    return !this.currentUrl.endsWith('/welcome')
  }

  back() {
    const url = this.currentUrl
    if (url.endsWith('/choose')) {
      this.router.navigate(['/setup/welcome'])
    } else if (url.endsWith('/create') || url.endsWith('/import')) {
      this.router.navigate(['/setup/choose'])
    } else if (url.endsWith('/backup')) {
      this.router.navigate(['/setup/choose'])
    } else if (url.endsWith('/verify')) {
      this.router.navigate(['/setup/backup'])
    } else if (url.endsWith('/done')) {
      this.router.navigate(['/setup/verify'])
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
  }
}



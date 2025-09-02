import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { ConfigService } from 'src/app/services/config.service'

@Injectable({ providedIn: 'root' })
export class IdentityFeatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService, private readonly router: Router) {}
  canActivate(): boolean {
    if (this.config.enableDidFlow) return true
    this.router.navigate(['/login'])
    return false
  }
}



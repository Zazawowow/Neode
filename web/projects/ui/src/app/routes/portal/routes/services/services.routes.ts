import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, ResolveFn, Routes } from '@angular/router'
import { defer, map, Observable, of } from 'rxjs'
import { share } from 'rxjs/operators'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { titleResolver } from 'src/app/utils/title-resolver'

import { ServiceOutletComponent } from './routes/outlet.component'
import { ServiceRoute } from './routes/service.component'

export const ROUTES: Routes = [
  {
    path: ':pkgId',
    title: titleResolver,
    component: ServiceOutletComponent,
    children: [
      {
        path: '',
        component: ServiceRoute,
      },
      {
        path: 'actions',
        loadComponent: () => import('./routes/actions.component'),
      },
      {
        path: 'interface/:interfaceId',
        loadComponent: () => import('./routes/interface.component'),
      },
      {
        path: 'logs',
        loadComponent: () => import('./routes/logs.component'),
      },
      {
        path: 'about',
        loadComponent: () => import('./routes/about.component'),
        resolve: { content: getStatic() },
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./dashboard/dashboard.component'),
  },
]

function getStatic(): ResolveFn<Observable<string>> {
  return ({ paramMap }: ActivatedRouteSnapshot) =>
    of(inject(ApiService)).pipe(
      map(api =>
        defer(() =>
          api.getStaticInstalled(paramMap.get('pkgId')!, 'LICENSE.md'),
        ).pipe(share()),
      ),
    )
}

export default ROUTES

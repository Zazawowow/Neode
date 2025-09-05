import { Injectable } from '@angular/core'
import { of, BehaviorSubject } from 'rxjs'

const mockData = {
  ui: {
    name: 'Neode',
    theme: 'dark',
    marketplace: {
      'selected-url': 'https://registry.start9.com/',
      'known-hosts': {
        'https://registry.start9.com/': { name: 'Start9 Registry' },
        'https://community-registry.start9.com/': { name: 'Community Registry' },
      },
    },
  },
  'server-info': {
    id: 'mock',
    version: '0.3.5.1',
    'ntp-synced': true,
    'status-info': {
      restarting: false,
      'shutting-down': false,
      'backup-progress': null,
    },
  },
  'package-data': {
    'mock-pkg': {
      manifest: {
        id: 'mock-pkg',
        title: 'Mock Package',
        version: '1.0.0',
        actions: {},
      },
      state: 'installed',
      'static-files': {
        icon: '',
      },
      'install-progress': null,
    },
  },
}

@Injectable()
export class MockPatchDB {
  cache$ = new BehaviorSubject(mockData)

  watch$(...args: string[]) {
    if (args.length === 0) return of(mockData)
    return of(this.getNestedValue(mockData, args))
  }

  private getNestedValue(obj: any, path: string[]) {
    return path.reduce(
      (current, key) =>
        current && typeof current === 'object' ? current[key] : undefined,
      obj,
    )
  }
}

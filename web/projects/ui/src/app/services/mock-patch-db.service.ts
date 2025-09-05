import { Injectable } from '@angular/core'
import { of, BehaviorSubject } from 'rxjs'
import { DBCache, PatchDB } from './patch-db/patch-db.service'
import { DataModel } from './patch-db/data-model'
import { mockPatchData } from '../services/api/mock-patch'

// Seed the mock DB with full fixture data, including Bitcoin Core and LND
const mockData: DataModel = mockPatchData

@Injectable()
export class MockPatchDB implements PatchDB<DataModel> {
  cache$ = new BehaviorSubject<DBCache<DataModel>>({ sequence: 1, data: mockData })

  watch$(...args: string[]) {
    if (args.length === 0) return of(mockData)
    return of(this.getNestedValue(mockData as any, args))
  }

  private getNestedValue(obj: any, path: string[]) {
    return path.reduce(
      (current, key) =>
        current && typeof current === 'object' ? current[key] : undefined,
      obj,
    )
  }

  start(bootstrapper: any): void {
    // Mock implementation - no actual initialization needed
  }

  stop(): void {
    // Mock implementation - no cleanup needed
  }
}

import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'

// Re-exporting types that were previously in 'patch-db-client'
export { Update } from '../api/api.types'
export class Bootstrapper {
  init(): any {}
}
export class DBCache {}
export class Dump {}
export class Revision {}
export class Operation {}
export class PatchOp {
  static readonly ADD: string = 'add'
  static readonly REMOVE: string = 'remove'
  static readonly REPLACE: string = 'replace'
}
export class RemoveOperation {}
export function pathFromArray(arr: string[]): string {
  return ''
}

export abstract class PatchDB<T = any> {
  abstract cache$: Observable<T>
  abstract watch$(...args: string[]): Observable<any>
}

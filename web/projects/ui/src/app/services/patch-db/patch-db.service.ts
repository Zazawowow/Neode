import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'
import { DataModel } from './data-model'

// Re-exporting types that were previously in 'patch-db-client'
export type Update<T> = {
  [K in keyof T]?: Update<T[K]>
} & {
  __newValue?: T
  __oldValue?: T
  __op?: 'add' | 'remove' | 'replace'
}
export class Bootstrapper<T> {
  init(): DBCache<T> | Promise<DBCache<T>> {
    return {
      sequence: 0,
      data: {} as T,
    }
  }
}
export class DBCache<T> {
  sequence: number = 0
  data: T = {} as T
}
export class Dump<T> {
  data: T = {} as T
  sequence: number = 0
  'last-modified': string = ''
}
export interface Revision<T = any> {
  id: number
  patch: Operation<any>[]
}

export interface Operation<T = any> {
  op: string
  path: string
  value?: T
}

export class PatchOp {
  static readonly ADD: string = 'add'
  static readonly REMOVE: string = 'remove'
  static readonly REPLACE: string = 'replace'
}
export interface RemoveOperation {
  op: string
  path: string
}
export function pathFromArray(arr: Array<string | number>): string {
  return (
    '/' +
    arr
      .map(seg => encodeURIComponent(String(seg)).replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('/')
  )
}

export abstract class PatchDB<T = any> {
  abstract cache$: Observable<DBCache<T>>
  abstract watch$(...args: string[]): Observable<any>
  abstract start(bootstrapper: Bootstrapper<T>): void
  abstract stop(): void
}

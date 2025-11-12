// API Types ported from Angular codebase

export interface DataModel {
  'server-info': ServerInfo
  'package-data': { [id: string]: PackageDataEntry }
  ui: UIData
}

export interface ServerInfo {
  id: string
  version: string
  name: string | null
  pubkey: string
  'status-info': StatusInfo
  'lan-address': string | null
  unread: number
  'wifi-ssids': string[]
  'zram-enabled': boolean
}

export interface StatusInfo {
  restarting: boolean
  'shutting-down': boolean
  'updated': boolean
  'backup-progress': number | null
  'update-progress': number | null
}

export interface UIData {
  name: string | null
  'ack-welcome': string
  marketplace: UIMarketplaceData
  theme: string
}

export interface UIMarketplaceData {
  'selected-hosts': string[]
  'known-hosts': Record<string, MarketplaceHost>
}

export interface MarketplaceHost {
  name: string
  url: string
}

export enum PackageState {
  Installing = 'installing',
  Installed = 'installed',
  Stopping = 'stopping',
  Stopped = 'stopped',
  Starting = 'starting',
  Running = 'running',
  Restarting = 'restarting',
  Creating = 'creating-backup',
  Restoring = 'restoring-backup',
  Removing = 'removing',
  BackingUp = 'backing-up',
}

export interface PackageDataEntry {
  state: PackageState
  'static-files': {
    license: string
    instructions: string
    icon: string
  }
  manifest: Manifest
  installed?: InstalledPackageDataEntry
  'install-progress'?: InstallProgress
}

export interface Manifest {
  id: string
  title: string
  version: string
  description: {
    short: string
    long: string
  }
  'release-notes': string
  license: string
  'wrapper-repo': string
  'upstream-repo': string
  'support-site': string
  'marketing-site': string
  'donation-url': string | null
}

export interface InstalledPackageDataEntry {
  'current-dependents': Record<string, CurrentDependencyInfo>
  'current-dependencies': Record<string, CurrentDependencyInfo>
  'last-backup': string | null
  'interface-addresses': Record<string, InterfaceAddress>
  status: ServiceStatus
}

export interface CurrentDependencyInfo {
  'health-checks': string[]
}

export interface InterfaceAddress {
  'tor-address': string
  'lan-address': string | null
}

export enum ServiceStatus {
  Stopped = 'stopped',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
  Restarting = 'restarting',
}

export interface InstallProgress {
  size: number
  downloaded: number
}

// RPC Request/Response types
export namespace RR {
  // Auth
  export interface LoginReq {
    password: string
    metadata: SessionMetadata
  }
  export type LoginRes = null

  export interface SessionMetadata {
    // Add session metadata fields
  }

  export interface LogoutReq {}
  export type LogoutRes = null

  export interface ResetPasswordReq {
    'old-password': string
    'new-password': string
  }
  export type ResetPasswordRes = null

  // Server
  export interface EchoReq {
    message: string
    timeout?: number
  }
  export type EchoRes = string

  export interface GetSystemTimeReq {}
  export interface GetSystemTimeRes {
    now: string
    uptime: number
  }

  export interface GetServerMetricsReq {}
  export interface GetServerMetricsRes {
    cpu: number
    disk: DiskInfo
    memory: MemoryInfo
  }

  export interface DiskInfo {
    used: number
    total: number
  }

  export interface MemoryInfo {
    used: number
    total: number
  }

  export interface UpdateServerReq {
    'marketplace-url': string
  }
  export type UpdateServerRes = 'updating' | 'no-updates'

  export interface RestartServerReq {}
  export type RestartServerRes = null

  export interface ShutdownServerReq {}
  export type ShutdownServerRes = null

  // Packages
  export interface InstallPackageReq {
    id: string
    'marketplace-url': string
    version: string
  }
  export type InstallPackageRes = string // guid

  export interface UninstallPackageReq {
    id: string
  }
  export type UninstallPackageRes = null

  export interface StartPackageReq {
    id: string
  }
  export type StartPackageRes = null

  export interface StopPackageReq {
    id: string
  }
  export type StopPackageRes = null

  export interface RestartPackageReq {
    id: string
  }
  export type RestartPackageRes = null
}

// JSON Patch types
export interface PatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: any
  from?: string
}

export interface Update<T> {
  sequence: number
  patch: PatchOperation[]
}


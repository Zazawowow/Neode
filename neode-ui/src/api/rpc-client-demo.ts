// Demo RPC Client - No actual HTTP calls, all mocked
// This replaces the real RPC client for demo builds

export interface RPCOptions {
  method: string
  params?: any
  timeout?: number
}

export interface RPCResponse<T> {
  result?: T
  error?: {
    code: number
    message: string
    data?: any
  }
}

class RPCClientDemo {
  private baseUrl: string

  constructor(baseUrl: string = '/rpc/v1') {
    this.baseUrl = baseUrl
    console.log('🎨 Demo Mode: RPC Client initialized (no backend)')
  }

  async call<T>(options: RPCOptions): Promise<T> {
    const { method, params = {} } = options

    console.log(`🎨 Demo RPC Call: ${method}`, params)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Mock responses based on method
    switch (method) {
      case 'auth.login':
        // Accept any password!
        return undefined as T

      case 'auth.logout':
        return undefined as T

      case 'server.echo':
        return params.message as T

      case 'server.time':
        return {
          now: new Date().toISOString(),
          uptime: Math.floor(Math.random() * 1000000)
        } as T

      case 'server.metrics':
        return {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
        } as T

      case 'server.update':
        return 'no-updates' as T

      case 'server.restart':
        return undefined as T

      case 'server.shutdown':
        return undefined as T

      case 'package.install':
        return 'installing' as T

      case 'package.uninstall':
      case 'package.start':
      case 'package.stop':
      case 'package.restart':
        return undefined as T

      default:
        console.log(`🎨 Demo: Unknown method ${method}, returning success`)
        return { success: true } as T
    }
  }

  // Convenience methods
  async login(password: string): Promise<void> {
    console.log('🎨 Demo Login: Accepting any password')
    return this.call({
      method: 'auth.login',
      params: { password, metadata: {} },
    })
  }

  async logout(): Promise<void> {
    return this.call({
      method: 'auth.logout',
      params: {},
    })
  }

  async echo(message: string): Promise<string> {
    return this.call({
      method: 'server.echo',
      params: { message },
    })
  }

  async getSystemTime(): Promise<{ now: string; uptime: number }> {
    return this.call({
      method: 'server.time',
      params: {},
    })
  }

  async getMetrics(): Promise<any> {
    return this.call({
      method: 'server.metrics',
      params: {},
    })
  }

  async updateServer(marketplaceUrl: string): Promise<'updating' | 'no-updates'> {
    return this.call({
      method: 'server.update',
      params: { 'marketplace-url': marketplaceUrl },
    })
  }

  async restartServer(): Promise<void> {
    return this.call({
      method: 'server.restart',
      params: {},
    })
  }

  async shutdownServer(): Promise<void> {
    return this.call({
      method: 'server.shutdown',
      params: {},
    })
  }

  async installPackage(id: string, marketplaceUrl: string, version: string): Promise<string> {
    return this.call({
      method: 'package.install',
      params: { id, 'marketplace-url': marketplaceUrl, version },
    })
  }

  async uninstallPackage(id: string): Promise<void> {
    return this.call({
      method: 'package.uninstall',
      params: { id },
    })
  }

  async startPackage(id: string): Promise<void> {
    return this.call({
      method: 'package.start',
      params: { id },
    })
  }

  async stopPackage(id: string): Promise<void> {
    return this.call({
      method: 'package.stop',
      params: { id },
    })
  }

  async restartPackage(id: string): Promise<void> {
    return this.call({
      method: 'package.restart',
      params: { id },
    })
  }
}

export const rpcClient = new RPCClientDemo()


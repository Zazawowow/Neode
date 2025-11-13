// RPC Client for connecting to Neode backend

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

class RPCClient {
  private baseUrl: string

  constructor(baseUrl: string = '/rpc/v1') {
    this.baseUrl = baseUrl
  }

  async call<T>(options: RPCOptions): Promise<T> {
    const { method, params = {}, timeout = 30000 } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        credentials: 'include', // Important for session cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, params }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: RPCResponse<T> = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'RPC Error')
      }

      return data.result as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  // Convenience methods
  async login(password: string): Promise<void> {
    return this.call({
      method: 'auth.login',
      params: {
        password,
        metadata: {
          // Add any metadata needed
        },
      },
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

  async getMarketplace(url: string): Promise<any> {
    return this.call({
      method: 'marketplace.get',
      params: { url },
    })
  }

  async sideloadPackage(manifest: any, icon: string): Promise<string> {
    return this.call({
      method: 'package.sideload',
      params: { manifest, icon },
      timeout: 120000, // 2 minutes for upload
    })
  }
}

export const rpcClient = new RPCClient()


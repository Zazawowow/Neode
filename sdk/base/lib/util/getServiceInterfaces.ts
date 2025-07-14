import { Effects } from "../Effects"
import { DropGenerator, DropPromise } from "./Drop"
import {
  ServiceInterfaceFilled,
  filledAddress,
  getHostname,
} from "./getServiceInterface"

const makeManyInterfaceFilled = async ({
  effects,
  packageId,
  callback,
}: {
  effects: Effects
  packageId?: string
  callback?: () => void
}) => {
  const serviceInterfaceValues = await effects.listServiceInterfaces({
    packageId,
    callback,
  })

  const serviceInterfacesFilled: ServiceInterfaceFilled[] = await Promise.all(
    Object.values(serviceInterfaceValues).map(async (serviceInterfaceValue) => {
      const hostId = serviceInterfaceValue.addressInfo.hostId
      const host = await effects.getHostInfo({
        packageId,
        hostId,
        callback,
      })
      if (!host) {
        throw new Error(`host ${hostId} not found!`)
      }
      return {
        ...serviceInterfaceValue,
        host,
        addressInfo: filledAddress(host, serviceInterfaceValue.addressInfo),
      }
    }),
  )
  return serviceInterfacesFilled
}

export class GetServiceInterfaces {
  constructor(
    readonly effects: Effects,
    readonly opts: { packageId?: string },
  ) {}

  /**
   * Returns the service interfaces for the package. Reruns the context from which it has been called if the underlying value changes
   */
  async const() {
    const { packageId } = this.opts
    const callback =
      this.effects.constRetry &&
      (() => this.effects.constRetry && this.effects.constRetry())
    const interfaceFilled: ServiceInterfaceFilled[] =
      await makeManyInterfaceFilled({
        effects: this.effects,
        packageId,
        callback,
      })

    return interfaceFilled
  }
  /**
   * Returns the service interfaces for the package. Does nothing if the value changes
   */
  async once() {
    const { packageId } = this.opts
    const interfaceFilled: ServiceInterfaceFilled[] =
      await makeManyInterfaceFilled({
        effects: this.effects,
        packageId,
      })

    return interfaceFilled
  }

  private async *watchGen(abort?: AbortSignal) {
    const { packageId } = this.opts
    const resolveCell = { resolve: () => {} }
    this.effects.onLeaveContext(() => {
      resolveCell.resolve()
    })
    abort?.addEventListener("abort", () => resolveCell.resolve())
    while (this.effects.isInContext && !abort?.aborted) {
      let callback: () => void = () => {}
      const waitForNext = new Promise<void>((resolve) => {
        callback = resolve
        resolveCell.resolve = resolve
      })
      yield await makeManyInterfaceFilled({
        effects: this.effects,
        packageId,
        callback,
      })
      await waitForNext
    }
  }

  /**
   * Watches the service interfaces for the package. Returns an async iterator that yields whenever the value changes
   */
  watch(
    abort?: AbortSignal,
  ): AsyncGenerator<ServiceInterfaceFilled[], void, unknown> {
    const ctrl = new AbortController()
    abort?.addEventListener("abort", () => ctrl.abort())
    return DropGenerator.of(this.watchGen(ctrl.signal), () => ctrl.abort())
  }

  /**
   * Watches the service interfaces for the package. Takes a custom callback function to run whenever the value changes
   */
  onChange(
    callback: (
      value: ServiceInterfaceFilled[] | null,
      error?: Error,
    ) => { cancel: boolean } | Promise<{ cancel: boolean }>,
  ) {
    ;(async () => {
      const ctrl = new AbortController()
      for await (const value of this.watch(ctrl.signal)) {
        try {
          const res = await callback(value)
          if (res.cancel) {
            ctrl.abort()
            break
          }
        } catch (e) {
          console.error(
            "callback function threw an error @ GetServiceInterfaces.onChange",
            e,
          )
        }
      }
    })()
      .catch((e) => callback(null, e))
      .catch((e) =>
        console.error(
          "callback function threw an error @ GetServiceInterfaces.onChange",
          e,
        ),
      )
  }

  /**
   * Watches the service interfaces for the package. Returns when the predicate is true
   */
  waitFor(
    pred: (value: ServiceInterfaceFilled[] | null) => boolean,
  ): Promise<ServiceInterfaceFilled[] | null> {
    const ctrl = new AbortController()
    return DropPromise.of(
      Promise.resolve().then(async () => {
        for await (const next of this.watchGen(ctrl.signal)) {
          if (pred(next)) {
            return next
          }
        }
        return null
      }),
      () => ctrl.abort(),
    )
  }
}
export function getServiceInterfaces(
  effects: Effects,
  opts: { packageId?: string },
) {
  return new GetServiceInterfaces(effects, opts)
}

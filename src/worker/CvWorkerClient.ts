import type { WorkerIn, WorkerOut, PreviewAnalysis, FinalDocument } from './types'

export class CvWorkerClient {
  private worker: Worker
  private ready: Promise<void>
  private resolvers: ((a: any) => void)[] = []

  constructor() {
    this.worker = new Worker(new URL('./cv.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const msg = e.data
      if (msg.type === 'log') console.log('[cv]', msg.data)
      else {
        const r = this.resolvers.shift()
        r?.(msg)
      }
    }
    this.ready = Promise.resolve()
  }

  async init({ engineLocation, useThreads, useSIMD, policies }: { engineLocation: string, useThreads: boolean, useSIMD: boolean, policies: { thresholds:any, adaptive:any, features:any } }) {
    await this._postAwait({ type: 'init', engineLocation, useThreads, useSIMD, policies })
  }

  async processPreviewFrame(bitmap: ImageBitmap): Promise<PreviewAnalysis> {
    const res = await this._postAwait({ type: 'preview', bitmap }) as any
    return res.data
  }

  async warpAndProcess(blob: Blob, polygon: any, postProcess?: boolean): Promise<FinalDocument> {
    const res = await this._postAwait({ type: 'warp', blob, polygon, postProcess }) as any
    return res.data
  }

  dispose() {
    this.worker.terminate()
  }

  private _postAwait(msg: WorkerIn): Promise<WorkerOut> {
    return new Promise((res) => {
      this.resolvers.push(res)
      this.worker.postMessage(msg, this._transferables(msg))
    })
  }

  private _transferables(msg: WorkerIn): Transferable[] | undefined {
    if (msg.type === 'preview') return [msg.bitmap]
    if (msg.type === 'warp') return []
    return undefined
  }
}

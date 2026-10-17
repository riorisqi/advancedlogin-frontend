import type { QrStatusSnapshot } from '@/domain/qr/qrSession'

export type QrStatusStreamHandlers = {
  /** Called with the current state right after connecting, then on every change. */
  onSnapshot(snapshot: QrStatusSnapshot): void
  /** The live stream can't be used (unsupported, refused, or permanently failed). */
  onUnavailable(): void
}

export interface QrStatusStream {
  subscribe(qrId: string, handlers: QrStatusStreamHandlers): () => void
}

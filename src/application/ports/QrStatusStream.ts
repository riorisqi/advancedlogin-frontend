import type { QrStatusSnapshot } from '@/domain/qr/qrSession'

export type QrStatusStreamHandlers = {
  /** Called with the current state right after connecting, then on every change. */
  onSnapshot(snapshot: QrStatusSnapshot): void
  /** The live stream can't be used (unsupported, refused, or permanently failed). */
  onUnavailable(): void
}

/** Server push for the desktop: "tell me whenever my QR's status changes". */
export interface QrStatusStream {
  /** Returns a function that closes the subscription. */
  subscribe(qrId: string, handlers: QrStatusStreamHandlers): () => void
}

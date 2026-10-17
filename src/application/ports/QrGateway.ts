import type { QrSession, QrStatusSnapshot } from '@/domain/qr/qrSession'

/** Desktop side of QR login. */
export interface QrGateway {
  /** Starts a new QR login attempt, bound to this browser (via an HttpOnly cookie the gateway never sees). */
  createSession(): Promise<QrSession>

  /** Current status. An unknown/expired session (or a lost binding cookie) comes back as EXPIRED. */
  getStatus(qrId: string, signal?: AbortSignal): Promise<QrStatusSnapshot>
}

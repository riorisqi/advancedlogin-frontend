import type { QrSession, QrStatusSnapshot } from '@/domain/qr/qrSession'

/** Desktop side of QR login. */
export interface QrGateway {
  /** Starts a new QR login attempt, bound to this browser (via an HttpOnly cookie the gateway never sees). */
  createSession(): Promise<QrSession>

  /** Current status. An unknown/expired session (or a lost binding cookie) comes back as EXPIRED. */
  getStatus(qrId: string, signal?: AbortSignal): Promise<QrStatusSnapshot>

  /**
   * Trades the one-time code (plus the browser's qr_bind cookie, sent automatically) for a
   * real session. Afterwards this browser is logged in: the backend set a new SESSION cookie.
   * Errors: QrNotFoundError (expired / not ours), QrConflictError (already used / not approved).
   */
  exchange(qrId: string, exchangeCode: string): Promise<void>
}

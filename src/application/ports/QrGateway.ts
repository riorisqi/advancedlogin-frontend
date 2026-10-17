import type { QrSession, QrStatusSnapshot } from '@/domain/qr/qrSession'

export interface QrGateway {
  /** Bound to this browser via an HttpOnly cookie the gateway never sees. */
  createSession(): Promise<QrSession>

  /** An unknown/expired session (or a lost binding cookie) comes back as EXPIRED. */
  getStatus(qrId: string, signal?: AbortSignal): Promise<QrStatusSnapshot>

  /** Errors: QrNotFoundError (expired / not ours), QrConflictError (already used / not approved). */
  exchange(qrId: string, exchangeCode: string): Promise<void>
}

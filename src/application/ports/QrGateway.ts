import type { QrSession } from '@/domain/qr/qrSession'

export interface QrGateway {
  /** Starts a new QR login attempt, bound to this browser (via an HttpOnly cookie the gateway never sees). */
  createSession(): Promise<QrSession>
}

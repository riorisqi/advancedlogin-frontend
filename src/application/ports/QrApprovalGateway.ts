import type { LoginRequest } from '@/domain/qr/loginRequest'

/** Errors: QrNotFoundError (expired/invalid), QrConflictError (already used / not allowed now). */
export interface QrApprovalGateway {
  /** Claims the QR for the current user; safe to call twice. */
  scan(qrId: string, signal?: AbortSignal): Promise<LoginRequest>

  approve(qrId: string): Promise<void>

  reject(qrId: string): Promise<void>
}

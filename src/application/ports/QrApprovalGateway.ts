import type { LoginRequest } from '@/domain/qr/loginRequest'

/**
 * Phone side of QR login. All calls run as the logged-in phone user.
 * Errors: QrNotFoundError (expired/invalid), QrConflictError (already used / not allowed now).
 */
export interface QrApprovalGateway {
  /** Claims the QR for the current user and returns the details to show. Safe to call twice. */
  scan(qrId: string, signal?: AbortSignal): Promise<LoginRequest>

  approve(qrId: string): Promise<void>

  reject(qrId: string): Promise<void>
}

/**
 * What the phone shows before the user approves: where and when the login was requested.
 * This is the QRLjacking defence. If the details don't match the computer in front of you,
 * someone relayed their QR code to you.
 */
export type LoginRequest = {
  qrId: string
  requestedAt: Date
  browser: string
  os: string
  ipAddress: string
  /** Local-clock deadline to approve/reject. */
  expiresAt: Date
}

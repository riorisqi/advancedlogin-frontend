/** Shown before approving, so a QR relayed from someone else's computer can be spotted (QRLjacking). */
export type LoginRequest = {
  qrId: string
  requestedAt: Date
  browser: string
  os: string
  ipAddress: string
  /** Approximate; absent when unknown. */
  approximateLocation?: string
  /** Local-clock deadline to approve/reject. */
  expiresAt: Date
}

export type QrSession = {
  id: string
  /** What the QR code encodes: the phone's approve URL. */
  content: string
  /** Already converted to *this browser's* clock (see httpQrGateway), so it's safe to compare with Date.now(). */
  expiresAt: Date
}

export function secondsUntilExpiry(session: QrSession, now: Date): number {
  return Math.max(0, Math.ceil((session.expiresAt.getTime() - now.getTime()) / 1000))
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

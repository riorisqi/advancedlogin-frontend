export type QrSession = {
  id: string
  content: string
  /** Already on this browser's clock, so it's safe to compare with Date.now(). */
  expiresAt: Date
}

/** Mirrors the backend state machine (docs/ARCHITECTURE.md §3). */
export type QrStatus = 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'REJECTED' | 'CONSUMED' | 'EXPIRED'

/** Deliberately says nothing about who scanned. */
export type QrStatusSnapshot = {
  status: QrStatus
  /** Local-clock expiry of the current state; absent once the session is gone (EXPIRED). */
  expiresAt?: Date
  /** Only with CONFIRMED. */
  exchangeCode?: string
}

export function secondsUntilExpiry(expiresAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

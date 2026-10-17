import { useCallback, useEffect, useRef, useState } from 'react'
import { secondsUntilExpiry, type QrSession, type QrStatusSnapshot } from '@/domain/qr/qrSession'
import { useDependencies } from '../dependencies'

/** Like WhatsApp Web: silently swap in a fresh QR a few times, then wait for a click. */
const MAX_AUTO_REFRESHES = 3

/** Polling interval. Slice 5 replaces polling with server push (SSE). */
const POLL_INTERVAL_MS = 2000

export type QrLoginState =
  | { kind: 'loading' }
  | { kind: 'active'; session: QrSession; status: 'PENDING' | 'SCANNED'; secondsLeft: number }
  | { kind: 'confirmed' }
  | { kind: 'rejected' }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }

export function useQrLogin(): { state: QrLoginState; refresh: () => void } {
  const { qrGateway } = useDependencies()
  const [state, setState] = useState<QrLoginState>({ kind: 'loading' })
  // Bumping this number asks the effect below for a new QR session.
  const [generation, setGeneration] = useState(0)
  const autoRefreshes = useRef(0)

  // 1. Create a session (on mount and whenever `generation` changes).
  useEffect(() => {
    let cancelled = false
    // Why queueMicrotask: in dev, React StrictMode runs effect → cleanup → effect synchronously.
    // Starting the POST in a microtask lets the first run be cancelled *before* it hits the
    // network. Otherwise two sessions get created and the browser keeps whichever qr_bind
    // cookie arrives last, which may not match the QR on screen.
    queueMicrotask(async () => {
      if (cancelled) return
      try {
        const session = await qrGateway.createSession()
        if (!cancelled) {
          setState({
            kind: 'active',
            session,
            status: 'PENDING',
            secondsLeft: secondsUntilExpiry(session.expiresAt, new Date()),
          })
        }
      } catch (err) {
        if (!cancelled) setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
      }
    })
    return () => {
      cancelled = true
    }
  }, [qrGateway, generation])

  // 2. Poll the status while a QR is on screen.
  const activeId = state.kind === 'active' ? state.session.id : null
  useEffect(() => {
    if (!activeId) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()

    // A setTimeout chain, not setInterval: the next poll is scheduled only after the previous
    // response arrived, so a slow network can never stack up overlapping requests.
    async function poll() {
      try {
        const snapshot = await qrGateway.getStatus(activeId!, controller.signal)
        if (stopped) return
        setState((prev) => applySnapshot(prev, activeId!, snapshot))
      } catch {
        // Network blip: keep the current state and try again on the next tick.
      }
      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS)
    }
    timer = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      stopped = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [qrGateway, activeId])

  // 3. Countdown, plus what to do when it hits zero.
  const activeSession = state.kind === 'active' ? state.session : null
  useEffect(() => {
    if (!activeSession) return
    const timer = setInterval(() => {
      const secondsLeft = secondsUntilExpiry(activeSession.expiresAt, new Date())
      if (secondsLeft > 0) {
        setState((prev) => (prev.kind === 'active' && prev.session === activeSession ? { ...prev, secondsLeft } : prev))
      } else if (autoRefreshes.current < MAX_AUTO_REFRESHES) {
        autoRefreshes.current += 1
        setState({ kind: 'loading' })
        setGeneration((g) => g + 1)
      } else {
        setState({ kind: 'expired' })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [activeSession])

  const refresh = useCallback(() => {
    autoRefreshes.current = 0
    setState({ kind: 'loading' })
    setGeneration((g) => g + 1)
  }, [])

  return { state, refresh }
}

/** Pure state transition: previous UI state + server snapshot → next UI state. */
function applySnapshot(prev: QrLoginState, polledId: string, snapshot: QrStatusSnapshot): QrLoginState {
  // Ignore late answers about a QR that's no longer on screen.
  if (prev.kind !== 'active' || prev.session.id !== polledId) return prev

  switch (snapshot.status) {
    case 'PENDING':
    case 'SCANNED': {
      if (snapshot.status === prev.status) return prev // nothing new: no re-render
      // Scanning restarts the server-side clock; follow it.
      const session = { ...prev.session, expiresAt: snapshot.expiresAt ?? prev.session.expiresAt }
      return { kind: 'active', session, status: snapshot.status, secondsLeft: secondsUntilExpiry(session.expiresAt, new Date()) }
    }
    case 'CONFIRMED':
      return { kind: 'confirmed' }
    case 'REJECTED':
      return { kind: 'rejected' }
    case 'EXPIRED':
    case 'CONSUMED':
      // Let the countdown effect handle it on its next tick (auto-refresh or "expired").
      return { ...prev, session: { ...prev.session, expiresAt: new Date() }, secondsLeft: 0 }
  }
}

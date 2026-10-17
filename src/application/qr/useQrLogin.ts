import { useCallback, useEffect, useRef, useState } from 'react'
import { secondsUntilExpiry, type QrSession, type QrStatusSnapshot } from '@/domain/qr/qrSession'
import { useDependencies } from '../dependencies'
import type { QrGateway } from '../ports/QrGateway'

/** Like WhatsApp Web: silently swap in a fresh QR a few times, then wait for a click. */
const MAX_AUTO_REFRESHES = 3

/** Fallback polling interval, used only when the live stream (SSE) can't be used. */
const POLL_INTERVAL_MS = 2000

/** How status updates are currently arriving (shown in dev, handy for learning/debugging). */
export type QrLiveTransport = 'sse' | 'polling'

export type QrLoginState =
  | { kind: 'loading' }
  | { kind: 'active'; session: QrSession; status: 'PENDING' | 'SCANNED'; secondsLeft: number }
  | { kind: 'confirmed' }
  | { kind: 'rejected' }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }

export function useQrLogin(): { state: QrLoginState; refresh: () => void; transport: QrLiveTransport } {
  const { qrGateway, qrStatusStream } = useDependencies()
  const [state, setState] = useState<QrLoginState>({ kind: 'loading' })
  // Id of the session whose stream failed (so it's being polled). Anything else is on SSE.
  const [pollingFor, setPollingFor] = useState<string | null>(null)
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

  // 2. Follow the status while a QR is on screen: live stream first, polling as fallback.
  const activeId = state.kind === 'active' ? state.session.id : null
  useEffect(() => {
    if (!activeId) return
    const apply = (snapshot: QrStatusSnapshot) => setState((prev) => applySnapshot(prev, activeId, snapshot))
    let stopPolling: (() => void) | undefined

    const unsubscribe = qrStatusStream.subscribe(activeId, {
      onSnapshot: apply,
      onUnavailable: () => {
        if (stopPolling) return
        setPollingFor(activeId)
        stopPolling = startPolling(qrGateway, activeId, apply)
      },
    })

    return () => {
      unsubscribe()
      stopPolling?.()
    }
  }, [qrGateway, qrStatusStream, activeId])

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

  // Derived during render instead of stored: no effect has to "reset" it for a new session.
  const transport: QrLiveTransport = activeId !== null && pollingFor === activeId ? 'polling' : 'sse'

  return { state, refresh, transport }
}

/**
 * Polls the snapshot endpoint until stopped. A setTimeout chain, not setInterval: the next poll
 * is scheduled only after the previous response arrived, so a slow network can never stack up
 * overlapping requests.
 */
function startPolling(qrGateway: QrGateway, qrId: string, onSnapshot: (s: QrStatusSnapshot) => void): () => void {
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()

  async function poll() {
    try {
      const snapshot = await qrGateway.getStatus(qrId, controller.signal)
      if (!stopped) onSnapshot(snapshot)
    } catch {
      // Network blip: keep the current state and try again on the next tick.
    }
    if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS)
  }
  void poll() // first poll right away: the stream just failed, so we know nothing current

  return () => {
    stopped = true
    controller.abort()
    clearTimeout(timer)
  }
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

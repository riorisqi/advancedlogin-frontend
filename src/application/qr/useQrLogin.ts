import { useCallback, useEffect, useRef, useState } from 'react'
import { secondsUntilExpiry, type QrSession } from '@/domain/qr/qrSession'
import { useDependencies } from '../dependencies'

/** Like WhatsApp Web: silently swap in a fresh QR a few times, then wait for a click. */
const MAX_AUTO_REFRESHES = 3

export type QrLoginState =
  | { kind: 'loading' }
  | { kind: 'active'; session: QrSession; secondsLeft: number }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }

export function useQrLogin(): { state: QrLoginState; refresh: () => void } {
  const { qrGateway } = useDependencies()
  const [state, setState] = useState<QrLoginState>({ kind: 'loading' })
  // Bumping this number asks the effect below for a new QR session.
  const [generation, setGeneration] = useState(0)
  const autoRefreshes = useRef(0)

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
          setState({ kind: 'active', session, secondsLeft: secondsUntilExpiry(session, new Date()) })
        }
      } catch (err) {
        if (!cancelled) setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
      }
    })
    return () => {
      cancelled = true
    }
  }, [qrGateway, generation])

  // Countdown: tick once a second while a QR is on screen.
  const activeSession = state.kind === 'active' ? state.session : null
  useEffect(() => {
    if (!activeSession) return
    const timer = setInterval(() => {
      const secondsLeft = secondsUntilExpiry(activeSession, new Date())
      if (secondsLeft > 0) {
        setState({ kind: 'active', session: activeSession, secondsLeft })
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

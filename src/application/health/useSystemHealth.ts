import { useEffect, useState } from 'react'
import type { SystemHealth } from '@/domain/health/systemHealth'
import { useDependencies } from '../dependencies'

// A discriminated union: `kind` tells TypeScript which other fields exist,
// so the UI can't accidentally read `health` while still loading.
export type SystemHealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; health: SystemHealth }
  | { kind: 'error'; message: string }

// Use case as a hook: orchestrates the port and exposes UI-ready state.
export function useSystemHealth(): SystemHealthState {
  const { healthGateway } = useDependencies()
  const [state, setState] = useState<SystemHealthState>({ kind: 'loading' })

  useEffect(() => {
    // AbortController cancels the request if the component unmounts
    // (React StrictMode mounts twice in dev, so this matters even here).
    const controller = new AbortController()
    healthGateway
      .check(controller.signal)
      .then((health) => setState({ kind: 'ok', health }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
      })
    return () => controller.abort()
  }, [healthGateway])

  return state
}

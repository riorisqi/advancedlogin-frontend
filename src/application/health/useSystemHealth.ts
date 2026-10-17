import { useEffect, useState } from 'react'
import type { SystemHealth } from '@/domain/health/systemHealth'
import { useDependencies } from '../dependencies'

export type SystemHealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; health: SystemHealth }
  | { kind: 'error'; message: string }

export function useSystemHealth(): SystemHealthState {
  const { healthGateway } = useDependencies()
  const [state, setState] = useState<SystemHealthState>({ kind: 'loading' })

  useEffect(() => {
    // Cancel on unmount (StrictMode mounts twice in dev).
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

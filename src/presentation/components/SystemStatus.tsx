import { useSystemHealth } from '@/application/health/useSystemHealth'
import { StatusRow } from './StatusRow'

export function SystemStatus() {
  const state = useSystemHealth()

  if (state.kind === 'loading') return <p className="text-slate-500">Checking backend…</p>
  if (state.kind === 'error') return <StatusRow label="Backend" up={false} detail={state.message} />
  return (
    <>
      <StatusRow label="Backend" up={state.health.application === 'UP'} />
      <StatusRow label="Redis" up={state.health.dataStore === 'UP'} />
    </>
  )
}

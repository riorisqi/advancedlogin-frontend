import { useSystemHealth } from '@/application/health/useSystemHealth'
import { StatusRow } from '../components/StatusRow'

// Presentation: renders state from a use-case hook. No fetch, no URLs, no DTOs here.
export function HealthPage() {
  const state = useSystemHealth()

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-900">AdvancedLogin</h1>
        <p className="mt-1 text-sm text-slate-500">Milestone 1 · stack check</p>

        <div className="mt-6 space-y-3">
          {state.kind === 'loading' && <p className="text-slate-500">Checking backend…</p>}
          {state.kind === 'error' && (
            <StatusRow label="Backend" up={false} detail={state.message} />
          )}
          {state.kind === 'ok' && (
            <>
              <StatusRow label="Backend" up={state.health.application === 'UP'} />
              <StatusRow label="Redis" up={state.health.dataStore === 'UP'} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

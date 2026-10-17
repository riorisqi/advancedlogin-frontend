import { useEffect, useState } from 'react'
import { fetchHealth, type HealthResponse } from './api/health'

// A discriminated union: `state.kind` tells TypeScript which other fields exist,
// so you can't accidentally read `data` while still loading.
type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

function App() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    // AbortController cancels the request if the component unmounts
    // (React StrictMode mounts twice in dev, so this matters even here).
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then((data) => setState({ kind: 'ok', data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
      })
    return () => controller.abort()
  }, [])

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
              <StatusRow label="Backend" up={state.data.status === 'UP'} />
              <StatusRow label="Redis" up={state.data.redis === 'UP'} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function StatusRow({ label, up, detail }: { label: string; up: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? 'UP' : 'DOWN'}
        {detail && <span className="ml-2 font-normal text-slate-500">{detail}</span>}
      </span>
    </div>
  )
}

export default App

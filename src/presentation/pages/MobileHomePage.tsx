import { useState } from 'react'
import { useAuth } from '@/application/auth/authContext'
import { Card } from '../components/Card'

/** Logged-in phone home. Gets the "Scan QR" button in slice 4. */
export function MobileHomePage() {
  const auth = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  if (auth.status !== 'authenticated') return null // RequireAuth handles the other states

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await auth.logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Card title={`Hi, ${auth.user.displayName}`} subtitle={`Signed in as @${auth.user.username}`}>
      <div className="space-y-3">
        <button
          disabled
          className="w-full rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-400"
          title="Coming in slice 4"
        >
          Scan QR code (slice 4)
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </Card>
  )
}

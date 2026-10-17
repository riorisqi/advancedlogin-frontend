import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/application/auth/authContext'
import { Card } from '../components/Card'

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
        <Link
          to="/m/scan"
          className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
        >
          Scan QR code
        </Link>
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

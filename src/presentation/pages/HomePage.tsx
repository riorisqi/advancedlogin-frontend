import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/application/auth/authContext'
import { Card } from '../components/Card'
import { QrLoginPanel } from '../components/QrLoginPanel'

/** Desktop entry point: QR login when signed out, a simple home when signed in. */
export function HomePage() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return <p className="p-6 text-slate-500">Loading…</p>
  }
  if (auth.status === 'anonymous') {
    return (
      <Card title="Log in with your phone" subtitle="No password needed on this computer" wide>
        <QrLoginPanel />
        <Footer />
      </Card>
    )
  }
  return <SignedInHome displayName={auth.user.displayName} onLogout={auth.logout} />
}

function SignedInHome({ displayName, onLogout }: { displayName: string; onLogout: () => Promise<void> }) {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Card title={`Welcome, ${displayName}`} subtitle="You are signed in on this computer">
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loggingOut ? 'Signing out…' : 'Sign out'}
      </button>
      <Footer />
    </Card>
  )
}

function Footer() {
  return (
    <div className="mt-8 flex justify-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
      <Link to="/m" className="hover:text-indigo-600">Phone app</Link>
      <Link to="/status" className="hover:text-indigo-600">System status</Link>
    </div>
  )
}

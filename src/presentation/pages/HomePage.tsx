import { Link } from 'react-router'
import { useAuth } from '@/application/auth/authContext'
import { Card } from '../components/Card'
import { SystemStatus } from '../components/SystemStatus'

/** Desktop landing page. Becomes the QR login screen in slice 3. */
export function HomePage() {
  const auth = useAuth()

  return (
    <Card title="AdvancedLogin" subtitle="Desktop · QR login arrives in slice 3">
      <div className="space-y-3">
        <SystemStatus />
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {auth.status === 'authenticated' ? (
            <>
              Signed in as <span className="font-semibold">{auth.user.displayName}</span>
            </>
          ) : auth.status === 'anonymous' ? (
            'Not signed in'
          ) : (
            'Checking session…'
          )}
        </div>
      </div>
      <Link to="/m" className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:underline">
        Open the phone app →
      </Link>
    </Card>
  )
}

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/application/auth/authContext'

/** UX, not security: the backend still rejects every request without a valid session. */
export function RequireAuth({ children, loginPath }: { children: ReactNode; loginPath: string }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <p className="p-6 text-slate-500">Loading…</p>
  }
  if (auth.status === 'anonymous') {
    // Remember where the user wanted to go, so login can send them back there.
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }
  return children
}

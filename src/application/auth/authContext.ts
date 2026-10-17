import { createContext, useContext } from 'react'
import type { User } from '@/domain/user/user'

// Who is logged in is app-wide state (header, route guards, pages), so it lives in one
// provider instead of every page calling /api/me itself.
export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User }

export type Auth = AuthState & {
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}

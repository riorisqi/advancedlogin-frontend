import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDependencies } from '../dependencies'
import { AuthContext, type Auth, type AuthState } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authGateway } = useDependencies()
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  // SESSION is HttpOnly, so asking the backend is the only way to know whether it's still valid.
  useEffect(() => {
    const controller = new AbortController()
    authGateway
      .currentUser(controller.signal)
      .then((user) => setState(user ? { status: 'authenticated', user } : { status: 'anonymous' }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'anonymous' })
      })
    return () => controller.abort()
  }, [authGateway])

  const login = useCallback(
    async (username: string, password: string) => {
      const user = await authGateway.login(username, password)
      setState({ status: 'authenticated', user })
    },
    [authGateway],
  )

  const logout = useCallback(async () => {
    await authGateway.logout()
    setState({ status: 'anonymous' })
  }, [authGateway])

  const refresh = useCallback(async () => {
    const user = await authGateway.currentUser()
    setState(user ? { status: 'authenticated', user } : { status: 'anonymous' })
  }, [authGateway])

  const value = useMemo<Auth>(() => ({ ...state, login, logout, refresh }), [state, login, logout, refresh])

  return <AuthContext value={value}>{children}</AuthContext>
}

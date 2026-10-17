import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDependencies } from '../dependencies'
import { AuthContext, type Auth, type AuthState } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authGateway } = useDependencies()
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  // On startup, ask the backend whether the SESSION cookie is still valid.
  // The cookie itself is HttpOnly: JS can't read it, so this round trip is the only way to know.
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

  // useMemo keeps the context value stable, so consumers don't re-render on every
  // provider render, only when the auth state actually changes.
  const value = useMemo<Auth>(() => ({ ...state, login, logout }), [state, login, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}

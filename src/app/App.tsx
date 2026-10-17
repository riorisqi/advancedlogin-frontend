import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '@/application/auth/AuthProvider'
import { RequireAuth } from '@/presentation/components/RequireAuth'
import { HomePage } from '@/presentation/pages/HomePage'
import { MobileHomePage } from '@/presentation/pages/MobileHomePage'
import { MobileLoginPage } from '@/presentation/pages/MobileLoginPage'
import { DependenciesProvider } from './DependenciesProvider'

export function App() {
  return (
    <DependenciesProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Desktop */}
            <Route path="/" element={<HomePage />} />

            {/* Phone ("/m" = mobile web app) */}
            <Route path="/m/login" element={<MobileLoginPage />} />
            <Route
              path="/m"
              element={
                <RequireAuth loginPath="/m/login">
                  <MobileHomePage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DependenciesProvider>
  )
}

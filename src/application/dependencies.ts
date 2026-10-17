import { createContext, useContext } from 'react'
import type { AuthGateway } from './ports/AuthGateway'
import type { HealthGateway } from './ports/HealthGateway'
import type { QrApprovalGateway } from './ports/QrApprovalGateway'
import type { QrGateway } from './ports/QrGateway'

// Every port the application needs. The concrete implementations are created in
// `src/app/` (the composition root) and handed down through this context, so
// application code never imports from `infrastructure/`.
export type Dependencies = {
  healthGateway: HealthGateway
  authGateway: AuthGateway
  qrGateway: QrGateway
  qrApprovalGateway: QrApprovalGateway
}

export const DependenciesContext = createContext<Dependencies | null>(null)

export function useDependencies(): Dependencies {
  const deps = useContext(DependenciesContext)
  if (!deps) {
    throw new Error('useDependencies must be used inside <DependenciesProvider>')
  }
  return deps
}

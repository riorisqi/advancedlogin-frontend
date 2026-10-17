import { createContext, useContext } from 'react'
import type { AuthGateway } from './ports/AuthGateway'
import type { HealthGateway } from './ports/HealthGateway'
import type { QrApprovalGateway } from './ports/QrApprovalGateway'
import type { QrCodeScanner } from './ports/QrCodeScanner'
import type { QrGateway } from './ports/QrGateway'
import type { QrStatusStream } from './ports/QrStatusStream'

// Ports only; the implementations come from app/DependenciesProvider.
export type Dependencies = {
  healthGateway: HealthGateway
  authGateway: AuthGateway
  qrGateway: QrGateway
  qrApprovalGateway: QrApprovalGateway
  qrStatusStream: QrStatusStream
  qrCodeScanner: QrCodeScanner
}

export const DependenciesContext = createContext<Dependencies | null>(null)

export function useDependencies(): Dependencies {
  const deps = useContext(DependenciesContext)
  if (!deps) {
    throw new Error('useDependencies must be used inside <DependenciesProvider>')
  }
  return deps
}

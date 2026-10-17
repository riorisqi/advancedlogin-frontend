import type { ReactNode } from 'react'
import { DependenciesContext, type Dependencies } from '@/application/dependencies'
import { createHttpAuthGateway } from '@/infrastructure/auth/httpAuthGateway'
import { createHttpHealthGateway } from '@/infrastructure/health/httpHealthGateway'
import { createHttpQrApprovalGateway } from '@/infrastructure/qr/httpQrApprovalGateway'
import { createHttpQrGateway } from '@/infrastructure/qr/httpQrGateway'
import { createSseQrStatusStream } from '@/infrastructure/qr/sseQrStatusStream'

// Composition root: the only place that knows about concrete infrastructure.
// Created once at module load so the objects keep a stable identity across renders.
const dependencies: Dependencies = {
  healthGateway: createHttpHealthGateway(),
  authGateway: createHttpAuthGateway(),
  qrGateway: createHttpQrGateway(),
  qrApprovalGateway: createHttpQrApprovalGateway(),
  qrStatusStream: createSseQrStatusStream(),
}

export function DependenciesProvider({ children }: { children: ReactNode }) {
  return <DependenciesContext value={dependencies}>{children}</DependenciesContext>
}

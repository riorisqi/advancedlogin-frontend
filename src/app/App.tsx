import { HealthPage } from '@/presentation/pages/HealthPage'
import { DependenciesProvider } from './DependenciesProvider'

export function App() {
  return (
    <DependenciesProvider>
      <HealthPage />
    </DependenciesProvider>
  )
}

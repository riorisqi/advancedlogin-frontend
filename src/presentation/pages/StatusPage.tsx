import { Link } from 'react-router'
import { Card } from '../components/Card'
import { SystemStatus } from '../components/SystemStatus'

export function StatusPage() {
  return (
    <Card title="System status" subtitle="Backend and Redis reachability">
      <div className="space-y-3">
        <SystemStatus />
      </div>
      <Link to="/" className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:underline">
        ← Back
      </Link>
    </Card>
  )
}

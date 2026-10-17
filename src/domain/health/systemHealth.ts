// Domain: plain TypeScript. No React, no fetch, no JSON field names from the backend.

export type HealthStatus = 'UP' | 'DOWN'

export type SystemHealth = {
  application: HealthStatus
  dataStore: HealthStatus
}

export function isFullyHealthy(health: SystemHealth): boolean {
  return health.application === 'UP' && health.dataStore === 'UP'
}

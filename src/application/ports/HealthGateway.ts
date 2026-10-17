import type { SystemHealth } from '@/domain/health/systemHealth'

export interface HealthGateway {
  check(signal?: AbortSignal): Promise<SystemHealth>
}

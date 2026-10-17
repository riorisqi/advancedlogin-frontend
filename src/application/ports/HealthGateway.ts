import type { SystemHealth } from '@/domain/health/systemHealth'

// Outbound port: the application says *what* it needs; infrastructure decides *how*
// (HTTP today, a fake in tests or Storybook tomorrow).
export interface HealthGateway {
  check(signal?: AbortSignal): Promise<SystemHealth>
}

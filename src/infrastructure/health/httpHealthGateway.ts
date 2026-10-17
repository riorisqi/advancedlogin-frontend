import type { HealthGateway } from '@/application/ports/HealthGateway'
import type { HealthStatus, SystemHealth } from '@/domain/health/systemHealth'
import { getJson } from '../http/httpClient'

// Wire format of GET /api/health.
type HealthResponseDto = {
  status: HealthStatus
  redis: HealthStatus
}

export function createHttpHealthGateway(): HealthGateway {
  return {
    async check(signal) {
      const dto = await getJson<HealthResponseDto>('/api/health', signal)
      return toDomain(dto)
    },
  }
}

function toDomain(dto: HealthResponseDto): SystemHealth {
  return { application: dto.status, dataStore: dto.redis }
}

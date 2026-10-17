// Mirrors HealthController.HealthResponse on the backend.
export type HealthResponse = {
  status: 'UP' | 'DOWN'
  redis: 'UP' | 'DOWN'
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  // Relative URL: in dev, Vite proxies /api to Spring (see vite.config.ts).
  const res = await fetch('/api/health', { signal })
  if (!res.ok) {
    throw new Error(`Backend responded ${res.status}`)
  }
  return res.json() as Promise<HealthResponse>
}

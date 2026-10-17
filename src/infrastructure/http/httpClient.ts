// Single place for fetch details (later: CSRF header, credentials, error mapping).
// Relative URLs: in dev, Vite proxies /api to Spring (see vite.config.ts).

export class HttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Backend responded ${status}`)
    this.status = status
  }
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new HttpError(res.status)
  }
  return res.json() as Promise<T>
}

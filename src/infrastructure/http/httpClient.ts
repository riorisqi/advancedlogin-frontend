// Single place for fetch details: JSON, CSRF, error mapping.
// Relative URLs: in dev, Vite proxies /api to Spring (see vite.config.ts), so the browser
// sees one origin and sends cookies (SESSION, XSRF-TOKEN) automatically.

export class HttpError extends Error {
  readonly status: number
  /** From the Retry-After header of a 429 (rate limited) response. */
  readonly retryAfterSeconds?: number

  constructor(status: number, retryAfterSeconds?: number) {
    super(
      status === 429
        ? `Too many requests. Try again in ${retryAfterSeconds ?? 60} seconds.`
        : `Backend responded ${status}`,
    )
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }

  static from(res: Response): HttpError {
    const retryAfter = Number(res.headers.get('Retry-After'))
    return new HttpError(res.status, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined)
  }
}

const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  body?: unknown
  signal?: AbortSignal
}

/**
 * Sends a request and returns the raw Response (callers decide what each status means).
 *
 * CSRF (double-submit cookie): Spring puts a random token in the XSRF-TOKEN cookie, which JS
 * *can* read. We copy it into the X-XSRF-TOKEN header. A malicious site can make the browser
 * send our cookies, but it can't read them, so it can't produce the matching header.
 */
export async function send(method: Method, url: string, options: RequestOptions = {}): Promise<Response> {
  const unsafe = method !== 'GET'
  if (unsafe && !readCookie(CSRF_COOKIE)) {
    await refreshCsrfToken()
  }

  const res = await doFetch(method, url, options)

  // Token rotated or expired (e.g. right after login/logout): refresh once and retry.
  if (unsafe && res.status === 403) {
    await refreshCsrfToken()
    return doFetch(method, url, options)
  }
  return res
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await send('GET', url, { signal })
  if (!res.ok) {
    throw HttpError.from(res)
  }
  return res.json() as Promise<T>
}

function doFetch(method: Method, url: string, { body, signal }: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const csrf = readCookie(CSRF_COOKIE)
  if (method !== 'GET' && csrf) headers[CSRF_HEADER] = csrf

  return fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    credentials: 'same-origin',
  })
}

async function refreshCsrfToken(): Promise<void> {
  // Makes the backend (re)issue the XSRF-TOKEN cookie.
  await fetch('/api/auth/csrf', { credentials: 'same-origin' })
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

import { QrConflictError, QrNotFoundError } from '@/application/qr/errors'
import type { QrApprovalGateway } from '@/application/ports/QrApprovalGateway'
import { HttpError, send } from '../http/httpClient'
import { toLocalClockFromResponse } from '../http/serverClock'

// Wire format of LoginRequestResponse (QrMobileController on the backend).
type LoginRequestDto = {
  qrId: string
  requestedAt: string
  browser: string
  os: string
  ipAddress: string
  approximateLocation: string | null
  expiresAt: string
}

export function createHttpQrApprovalGateway(): QrApprovalGateway {
  const path = (qrId: string, action: string) => `/api/qr/sessions/${encodeURIComponent(qrId)}/${action}`

  return {
    async scan(qrId, signal) {
      const res = await send('POST', path(qrId, 'scan'), { signal })
      await throwOnError(res)
      const dto: LoginRequestDto = await res.json()
      return {
        qrId: dto.qrId,
        requestedAt: new Date(dto.requestedAt), // a past moment, shown as-is
        browser: dto.browser,
        os: dto.os,
        ipAddress: dto.ipAddress,
        approximateLocation: dto.approximateLocation ?? undefined,
        expiresAt: toLocalClockFromResponse(dto.expiresAt, res), // a deadline: correct for clock skew
      }
    },

    async approve(qrId) {
      await throwOnError(await send('POST', path(qrId, 'approve')))
    },

    async reject(qrId) {
      await throwOnError(await send('POST', path(qrId, 'reject')))
    },
  }
}

async function throwOnError(res: Response): Promise<void> {
  if (res.ok) return
  if (res.status === 404) throw new QrNotFoundError()
  if (res.status === 409) {
    // ProblemDetail body: { title, detail, status }. Show the backend's explanation.
    const problem = (await res.json().catch(() => null)) as { detail?: string } | null
    throw new QrConflictError(problem?.detail)
  }
  throw HttpError.from(res)
}

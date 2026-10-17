import { QrConflictError, QrNotFoundError } from '@/application/qr/errors'
import type { QrGateway } from '@/application/ports/QrGateway'
import type { QrStatus } from '@/domain/qr/qrSession'
import { HttpError, send } from '../http/httpClient'
import { toLocalClockFromResponse } from '../http/serverClock'

// Wire formats (QrDesktopController on the backend).
type CreateQrSessionDto = {
  qrId: string
  qrContent: string
  expiresAt: string // server clock
}

type QrStatusDto = {
  status: QrStatus
  expiresAt: string
  exchangeCode: string | null
}

export function createHttpQrGateway(): QrGateway {
  return {
    async createSession() {
      // Also sets the HttpOnly qr_bind cookie, which the browser handles on its own.
      const res = await send('POST', '/api/qr/sessions')
      if (res.status !== 201) throw HttpError.from(res)
      const dto: CreateQrSessionDto = await res.json()
      return { id: dto.qrId, content: dto.qrContent, expiresAt: toLocalClockFromResponse(dto.expiresAt, res) }
    },

    async getStatus(qrId, signal) {
      const res = await send('GET', `/api/qr/sessions/${encodeURIComponent(qrId)}`, { signal })
      // 404 = gone, expired or not ours: all mean "expired" here.
      if (res.status === 404) return { status: 'EXPIRED' }
      if (!res.ok) throw HttpError.from(res)
      const dto: QrStatusDto = await res.json()
      return {
        status: dto.status,
        expiresAt: toLocalClockFromResponse(dto.expiresAt, res),
        exchangeCode: dto.exchangeCode ?? undefined,
      }
    },

    async exchange(qrId, exchangeCode) {
      const res = await send('POST', `/api/qr/sessions/${encodeURIComponent(qrId)}/exchange`, {
        body: { code: exchangeCode },
      })
      if (res.status === 404) throw new QrNotFoundError()
      if (res.status === 400 || res.status === 409) throw new QrConflictError('This login request can no longer be completed')
      if (!res.ok) throw HttpError.from(res)
      // The new SESSION cookie is set; the auth state re-reads /api/me itself.
    },
  }
}

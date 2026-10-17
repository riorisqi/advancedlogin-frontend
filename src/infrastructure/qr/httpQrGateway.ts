import type { QrGateway } from '@/application/ports/QrGateway'
import type { QrSession } from '@/domain/qr/qrSession'
import { HttpError, send } from '../http/httpClient'

// Wire format of CreateQrSessionResponse (QrDesktopController on the backend).
type CreateQrSessionDto = {
  qrId: string
  qrContent: string
  expiresAt: string // ISO-8601, server clock
}

export function createHttpQrGateway(): QrGateway {
  return {
    async createSession() {
      // The response also sets the HttpOnly qr_bind cookie. We never touch it: the browser
      // stores it and sends it back to /api/qr/* on its own.
      const res = await send('POST', '/api/qr/sessions')
      if (res.status !== 201) throw new HttpError(res.status)
      const dto: CreateQrSessionDto = await res.json()
      return toDomain(dto, res.headers.get('Date'))
    },
  }
}

/**
 * Clock skew: the user's PC clock may be minutes off from the server's. So instead of trusting
 * the absolute `expiresAt`, take the *remaining lifetime* (expiresAt - server's Date header) and
 * add it to the local clock.
 */
function toDomain(dto: CreateQrSessionDto, serverDateHeader: string | null): QrSession {
  const serverExpiresAt = new Date(dto.expiresAt).getTime()
  const serverNow = serverDateHeader ? new Date(serverDateHeader).getTime() : Date.now()
  const lifetimeMs = serverExpiresAt - serverNow
  return {
    id: dto.qrId,
    content: dto.qrContent,
    expiresAt: new Date(Date.now() + lifetimeMs),
  }
}

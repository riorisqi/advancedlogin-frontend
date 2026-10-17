import type { QrStatusStream } from '@/application/ports/QrStatusStream'
import type { QrStatus } from '@/domain/qr/qrSession'
import { toLocalClock } from '../http/serverClock'

// JSON of each `event: status` message (QrStatusStreams.QrStatusEvent on the backend).
type QrStatusEventDto = {
  status: QrStatus
  expiresAt: string
  exchangeCode: string | null
  serverTime: string // EventSource hides response headers, so the server sends its clock in the payload
}

/**
 * EventSource = the browser's built-in SSE client. It sends cookies on same-origin requests
 * (so qr_bind goes along), parses the `event:`/`data:` lines, and reconnects on its own after
 * a dropped connection. On reconnect the server starts with a fresh snapshot, so nothing is lost.
 */
export function createSseQrStatusStream(): QrStatusStream {
  return {
    subscribe(qrId, { onSnapshot, onUnavailable }) {
      if (typeof EventSource === 'undefined') {
        onUnavailable()
        return () => {}
      }

      const source = new EventSource(`/api/qr/sessions/${encodeURIComponent(qrId)}/events`)

      source.addEventListener('status', (event) => {
        const dto = JSON.parse(event.data) as QrStatusEventDto
        onSnapshot({
          status: dto.status,
          expiresAt: toLocalClock(dto.expiresAt, new Date(dto.serverTime).getTime()),
          exchangeCode: dto.exchangeCode ?? undefined,
        })
      })

      source.onerror = () => {
        // CONNECTING: a transient drop, EventSource is already retrying. Nothing to do.
        // CLOSED: it gave up for good (e.g. a 404 because the session expired or isn't ours).
        if (source.readyState === EventSource.CLOSED) {
          onUnavailable()
        }
      }

      return () => source.close()
    },
  }
}

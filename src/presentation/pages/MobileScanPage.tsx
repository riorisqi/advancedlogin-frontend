import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { CameraProblem } from '@/application/qr/errors'
import { useQrScanner } from '@/application/qr/useQrScanner'
import { parseApproveLink } from '@/domain/qr/approveLink'
import { Card } from '../components/Card'

const CAMERA_ADVICE: Record<CameraProblem, string> = {
  'insecure-context':
    'The camera only works over HTTPS. Open the https:// network address shown by `bun run dev:lan`.',
  'permission-denied': 'Camera access was blocked. Allow it in your browser’s site settings and reload.',
  'no-camera': 'No camera was found on this device.',
  unsupported: 'This browser can’t access the camera.',
  unknown: 'The camera could not be started.',
}

export function MobileScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const origin = window.location.origin
  const state = useQrScanner(videoRef, origin)

  useEffect(() => {
    if (state.kind === 'found') navigate(`/m/approve/${state.qrId}`, { replace: true })
  }, [state, navigate])

  return (
    <Card title="Scan QR code" subtitle="Point your camera at the QR code on your computer">
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {state.kind !== 'error' && (
          // Viewfinder: purely visual; the decoder looks at the whole frame.
          <div className="pointer-events-none absolute inset-[15%] rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
        )}
        {state.kind === 'starting' && (
          <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white/90">Starting camera…</p>
        )}
        {state.kind === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
            {CAMERA_ADVICE[state.problem]}
          </div>
        )}
      </div>

      <p className="mt-3 min-h-5 text-center text-sm text-slate-600" aria-live="polite">
        {state.kind === 'scanning' && state.lastRejected?.kind === 'not-ours' && 'That isn’t an AdvancedLogin QR code.'}
        {state.kind === 'scanning' &&
          state.lastRejected?.kind === 'other-origin' &&
          `That QR code points to ${state.lastRejected.origin}. Open the computer’s login page using the same address as this phone.`}
      </p>

      <PasteLinkForm origin={origin} onQrId={(qrId) => navigate(`/m/approve/${qrId}`, { replace: true })} />

      <Link to="/m" className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:underline">
        Cancel
      </Link>
    </Card>
  )
}

/** No camera (or testing on a laptop)? The link from the desktop works too, with the same checks. */
function PasteLinkForm({ origin, onQrId }: { origin: string; onQrId: (qrId: string) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parseApproveLink(text, origin)
    if (result.kind === 'ok') onQrId(result.qrId)
    else setError(result.kind === 'other-origin' ? `That link points to ${result.origin}.` : 'That isn’t an approve link.')
  }

  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-slate-500">Paste the link instead</summary>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
          placeholder={`${origin}/m/approve/…`}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          aria-label="Approve link"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white">
          Open
        </button>
      </form>
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </details>
  )
}

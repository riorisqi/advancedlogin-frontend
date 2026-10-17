import { QRCodeSVG } from 'qrcode.react'
import { useQrLogin } from '@/application/qr/useQrLogin'
import { formatCountdown } from '@/domain/qr/qrSession'

const QR_SIZE = 224

export function QrLoginPanel() {
  const { state, refresh } = useQrLogin()

  return (
    <div className="flex flex-col-reverse items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
      <ol className="list-decimal space-y-3 pl-5 text-slate-700 sm:max-w-xs">
        <li>Open <span className="font-semibold">AdvancedLogin</span> on your phone</li>
        <li>Tap <span className="font-semibold">Scan QR code</span></li>
        <li>Point your phone at this screen, check the details and confirm</li>
      </ol>

      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center rounded-xl bg-white p-3 ring-1 ring-slate-200"
          style={{ width: QR_SIZE + 24, height: QR_SIZE + 24 }}
        >
          {state.kind === 'active' && (
            // level "M" (~15% error correction): survives glare and a slightly blurry camera,
            // without making the code so dense that cheap phones struggle to read it.
            <QRCodeSVG value={state.session.content} size={QR_SIZE} level="M" title="Login QR code" />
          )}
          {state.kind === 'loading' && <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />}
          {(state.kind === 'expired' || state.kind === 'error') && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-slate-600">
                {state.kind === 'expired' ? 'QR code expired' : 'Could not load QR code'}
              </p>
              <button
                onClick={refresh}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Reload QR code
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 h-5 text-sm text-slate-500" aria-live="polite">
          {state.kind === 'active' && <>Expires in {formatCountdown(state.secondsLeft)}</>}
        </p>

        {/* Dev shortcut until the phone camera scanner exists (slice 7): open the approve URL directly. */}
        {import.meta.env.DEV && state.kind === 'active' && (
          <a
            href={state.session.content}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-xs text-indigo-600 hover:underline"
          >
            dev: open approve link
          </a>
        )}
      </div>
    </div>
  )
}

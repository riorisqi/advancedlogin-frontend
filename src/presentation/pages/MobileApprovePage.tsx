import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '@/application/auth/authContext'
import { useQrApproval } from '@/application/qr/useQrApproval'
import { Card } from '../components/Card'
import { Countdown } from '../components/Countdown'

/** Opened by scanning the desktop's QR (/m/approve/:qrId). Behind RequireAuth: the phone must be logged in. */
export function MobileApprovePage() {
  const { qrId = '' } = useParams()
  const auth = useAuth()
  const { state, approve, reject } = useQrApproval(qrId)
  const username = auth.status === 'authenticated' ? auth.user.username : ''

  if (state.kind === 'loading') {
    return <Card title="Checking QR code…"><p className="text-slate-500">One moment.</p></Card>
  }

  if (state.kind === 'approved') {
    return (
      <Result icon="✅" title="Login approved" text="Your computer will be signed in in a moment. You can put your phone away." />
    )
  }

  if (state.kind === 'rejected') {
    return <Result icon="⛔" title="Login declined" text="Nobody was signed in. The QR code can't be used again." />
  }

  if (state.kind === 'failed') {
    const text =
      state.reason === 'expired'
        ? 'Refresh the QR code on your computer and scan it again.'
        : state.message
    return <Result icon="⚠️" title={state.reason === 'expired' ? 'QR code expired' : "Can't use this QR code"} text={text} />
  }

  const { request, busy } = state
  return (
    <Card title="Log in on a computer?" subtitle={`As @${username}`}>
      <dl className="divide-y divide-slate-100 rounded-lg bg-slate-50 text-sm">
        <Detail label="Browser" value={request.browser} />
        <Detail label="Operating system" value={request.os} />
        <Detail label="IP address" value={request.ipAddress} />
        <Detail label="Requested at" value={request.requestedAt.toLocaleTimeString()} />
        <Detail label="Time left" value={<Countdown deadline={request.expiresAt} />} />
      </dl>

      {/* QRLjacking: an attacker can show *their* QR to the victim. These details are the defence. */}
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Only approve if you're in front of this computer and just opened its login page yourself.
        Never approve a QR code that someone sent you.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={reject}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={approve}
          disabled={busy}
          className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          {busy ? '…' : 'Approve'}
        </button>
      </div>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function Result({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <Card title={title}>
      <p className="text-4xl" aria-hidden>{icon}</p>
      <p className="mt-3 text-slate-600">{text}</p>
      <Link to="/m" className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:underline">
        Back to home
      </Link>
    </Card>
  )
}

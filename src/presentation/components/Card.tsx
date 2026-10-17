import type { ReactNode } from 'react'

type CardProps = {
  title: string
  subtitle?: string
  /** Wider card for the desktop QR screen; default is phone-sized. */
  wide?: boolean
  children: ReactNode
}

export function Card({ title, subtitle, wide = false, children }: CardProps) {
  return (
    <main className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-sm'} rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8`}
      >
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}

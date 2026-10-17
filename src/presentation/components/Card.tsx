import type { ReactNode } from 'react'

type CardProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Centered card layout shared by the desktop and phone screens (mobile-first: full width under 400px). */
export function Card({ title, subtitle, children }: CardProps) {
  return (
    <main className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}

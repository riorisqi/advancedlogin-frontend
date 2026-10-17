type StatusRowProps = {
  label: string
  up: boolean
  detail?: string
}

export function StatusRow({ label, up, detail }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? 'UP' : 'DOWN'}
        {detail && <span className="ml-2 font-normal text-slate-500">{detail}</span>}
      </span>
    </div>
  )
}

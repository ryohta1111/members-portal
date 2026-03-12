'use client'

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'OPEN', className: 'bg-green-600' },
  upcoming: { label: '予定', className: 'bg-yellow-600' },
  closed: { label: '終了', className: 'bg-zinc-600' },
  paid: { label: '配布済', className: 'bg-blue-600' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-zinc-600' }
  return (
    <span className={`${config.className} text-white text-xs font-bold px-2 py-0.5 rounded`}>
      {config.label}
    </span>
  )
}

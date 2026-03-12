'use client'

const STYLES: Record<string, string> = {
  open: 'bg-[#dcfce7] text-[#15803d] border-[#86efac]',
  upcoming: 'bg-[#fef9c3] text-[#854d0e] border-[#fde047]',
  closed: 'bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]',
  paid: 'bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd]',
}

const LABELS: Record<string, string> = {
  open: 'Open',
  upcoming: 'Upcoming',
  closed: 'Closed',
  paid: 'Paid',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide border-[1.5px] ${STYLES[status] || STYLES.closed}`}>
      {LABELS[status] || status}
    </span>
  )
}

'use client'

const STYLES: Record<string, string> = {
  festival: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e9d5ff]',
  standard: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  event: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
}

const LABELS: Record<string, string> = {
  festival: 'Festival Pool',
  standard: 'Normal Pool',
  event: 'Event Pool',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${STYLES[category] || STYLES.standard}`}>
      {LABELS[category] || category}
    </span>
  )
}

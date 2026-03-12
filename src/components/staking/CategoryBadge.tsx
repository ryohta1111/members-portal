'use client'

const categoryConfig: Record<string, { label: string; className: string }> = {
  festival: { label: '🎪 祭り', className: 'bg-violet-700' },
  standard: { label: '📦 通常', className: 'bg-sky-600' },
  event: { label: '⚡ イベント', className: 'bg-orange-500' },
}

export function CategoryBadge({ category }: { category: string }) {
  const config = categoryConfig[category] || { label: category, className: 'bg-zinc-600' }
  return (
    <span className={`${config.className} text-white text-xs px-2 py-0.5 rounded`}>
      {config.label}
    </span>
  )
}

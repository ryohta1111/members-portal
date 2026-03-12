'use client'

interface ProgressBarProps {
  current: number
  max: number
  decimals: number
}

export function ProgressBar({ current, max, decimals }: ProgressBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const isDanger = pct >= 90
  const fmt = (v: number) => (v / Math.pow(10, decimals)).toLocaleString()

  return (
    <div>
      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isDanger ? 'bg-[var(--red)]' : 'bg-[var(--green)]'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-xs text-[var(--text-sub)] font-mono">
        {fmt(current)} / {fmt(max)}
      </div>
    </div>
  )
}

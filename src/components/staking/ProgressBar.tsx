'use client'

interface ProgressBarProps {
  current: number
  max: number
  decimals: number
  symbol: string
}

export function ProgressBar({ current, max, decimals, symbol }: ProgressBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const isLow = pct >= 90

  const fmt = (v: number) => (v / Math.pow(10, decimals)).toLocaleString()

  return (
    <div>
      <div className="w-full h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-[#16a34a]'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-[#888] mt-1">
        {fmt(current)} / {fmt(max)}
      </p>
    </div>
  )
}

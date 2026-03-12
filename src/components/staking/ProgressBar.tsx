'use client'

interface ProgressBarProps {
  current: number
  max: number
  decimals: number
  symbol: string
}

export function ProgressBar({ current, max, decimals, symbol }: ProgressBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const remaining = max - current
  const isLow = pct >= 90

  const fmt = (v: number) => (v / Math.pow(10, decimals)).toLocaleString()

  return (
    <div>
      <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-white'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-[#888]">
        <span>{fmt(current)} / {fmt(max)} {symbol}</span>
        <span className={isLow ? 'text-red-400' : ''}>残 {fmt(remaining)}</span>
      </div>
    </div>
  )
}

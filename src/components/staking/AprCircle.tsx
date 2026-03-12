'use client'

import { useState, useEffect } from 'react'
import { useCountUp } from './useCountUp'

interface AprCircleProps {
  apr: number
  size?: number
}

export function AprCircle({ apr, size = 88 }: AprCircleProps) {
  const [mounted, setMounted] = useState(false)
  const animatedApr = useCountUp(apr, 1000)
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const fillPercent = Math.min(apr, 100) / 100

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth="3"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? circumference * (1 - fillPercent) : circumference}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-[var(--green)] leading-none">{animatedApr}%</span>
        <span className="text-[10px] text-[var(--text-sub)] font-medium mt-0.5">APR</span>
      </div>
    </div>
  )
}

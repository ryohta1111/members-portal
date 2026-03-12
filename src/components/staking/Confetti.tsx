'use client'

import { useEffect, useState } from 'react'

export function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number; left: number; top: number; delay: number; duration: number;
    color: string; width: number; height: number; borderRadius: string
  }>>([])

  useEffect(() => {
    const colors = ['#16a34a', '#3b82f6', '#f97316', '#7c3aed', '#eab308', '#ef4444']
    const p = Array.from({ length: 40 }, (_, i) => {
      const size = 6 + Math.random() * 6
      const isCircle = Math.random() > 0.5
      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 20,
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: size,
        height: size,
        borderRadius: isCircle ? '50%' : '2px',
      }
    })
    setParticles(p)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-0"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: p.borderRadius,
            animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  )
}

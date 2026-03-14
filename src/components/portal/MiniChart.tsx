'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler)

interface MiniChartProps {
  mint: string | null
  up: boolean
}

const PERIODS = ['1H', '24H', '7D'] as const
const PERIOD_MAP: Record<string, string> = { '1H': '1h', '24H': '24h', '7D': '7d' }

// Placeholder data when no mint
function placeholderData(): number[] {
  const base = 0.001 + Math.random() * 0.01
  return Array.from({ length: 7 }, () => base + (Math.random() - 0.5) * base * 0.3)
}

export function MiniChart({ mint, up }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [period, setPeriod] = useState<string>('7D')
  const [prices, setPrices] = useState<number[]>([])
  const placeholderRef = useRef<number[]>(placeholderData())

  useEffect(() => {
    if (!mint) {
      setPrices(placeholderRef.current)
      return
    }
    const p = PERIOD_MAP[period] || '7d'
    fetch(`/api/chart/${mint}?period=${p}`)
      .then(r => r.json())
      .then(d => {
        const data = d.prices || []
        setPrices(data.length > 0 ? data : placeholderRef.current)
      })
      .catch(() => setPrices(placeholderRef.current))
  }, [mint, period])

  useEffect(() => {
    if (!canvasRef.current || prices.length === 0) return

    const isPlaceholder = !mint
    const color = isPlaceholder ? '#D4D1CB' : (up ? '#15803D' : '#DC2626')
    const bg = isPlaceholder ? 'rgba(212,209,203,0.1)' : (up ? 'rgba(21,128,61,0.07)' : 'rgba(220,38,38,0.07)')

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: prices.map((_, i) => i),
        datasets: [{
          data: prices,
          borderColor: color,
          borderWidth: 1.5,
          backgroundColor: bg,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [prices, up, mint])

  return (
    <div>
      <div className="chart-tabs">
        {PERIODS.map(p => (
          <button
            key={p}
            className={`chart-tab ${period === p ? 'on' : ''}`}
            onClick={(e) => { e.stopPropagation(); setPeriod(p) }}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="tchart">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

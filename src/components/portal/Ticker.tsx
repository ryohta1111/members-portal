'use client'

import { useEffect, useState } from 'react'

interface TokenPrice {
  ticker: string
  price: string | null
  priceChange24h: number | null
}

export function Ticker() {
  const [stats, setStats] = useState<{ price: string; change: number } | null>(null)
  const [tokens, setTokens] = useState<TokenPrice[]>([])

  useEffect(() => {
    fetch('/api/035hp-stats')
      .then(r => r.json())
      .then(d => setStats({ price: d.price || '$0.00', change: d.priceChange24h || 0 }))
      .catch(() => {})

    fetch('/api/tokens')
      .then(r => r.json())
      .then(d => {
        const items = (d.tokens || [])
          .filter((t: any) => t.price)
          .map((t: any) => ({
            ticker: t.ticker,
            price: t.price,
            priceChange24h: t.priceChange24h,
          }))
        setTokens(items)
      })
      .catch(() => {})
  }, [])

  const tickerItems = [...tokens, ...tokens] // duplicate for seamless scroll

  return (
    <div className="ticker">
      <div className="tb">
        <span style={{ opacity: 0.5, fontSize: 9, fontWeight: 700, letterSpacing: '0.5px' }}>035HP</span>
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{stats?.price || '—'}</span>
        {stats && (
          <span className={stats.change >= 0 ? 'up' : 'dn'}>
            {stats.change >= 0 ? '+' : ''}{stats.change?.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="tw">
        <div className="ti">
          {tickerItems.map((t, i) => (
            <span key={i} className="ti-item">
              <span style={{ opacity: 0.5 }}>{t.ticker}</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>{t.price}</span>
              <span className={t.priceChange24h != null && t.priceChange24h >= 0 ? 'up' : 'dn'}>
                {t.priceChange24h != null ? `${t.priceChange24h >= 0 ? '+' : ''}${t.priceChange24h.toFixed(1)}%` : '—'}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

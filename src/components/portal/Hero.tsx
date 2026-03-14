'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

interface Stats {
  price: string | null
  priceChange24h: number | null
  marketCap: number | null
  volume24h: number | null
  holders: number | null
}

function fmtMoney(val: number | null) {
  if (val == null) return '—'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

export function Hero() {
  const [stats, setStats] = useState<Stats | null>(null)
  const { connected } = useWallet()

  useEffect(() => {
    fetch('/api/035hp-stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  return (
    <div style={{ background: 'var(--p-surface)', borderBottom: '0.5px solid var(--p-border-mid)' }}>
      <div className="wrap">
        <div className="hero">
          <div>
            <div className="ey">Community Portal</div>
            <h1>035HP<br />Community Hub</h1>
            <p>Token holders unlock the full ecosystem — voting, staking, chat, and exclusive games.</p>
            <div className="hbtns">
              {!connected ? (
                <WalletMultiButton className="p-connect-btn" />
              ) : (
                <button className="bp" onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Explore Features
                </button>
              )}
              <button className="bg-btn" onClick={() => { document.getElementById('howit')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hstats">
            <div className="hs">
              <div className="hl">Price</div>
              <div className="hv">{stats?.price || '—'}</div>
              <div className={`hsub ${stats?.priceChange24h != null && stats.priceChange24h >= 0 ? 'up2' : 'dn2'}`}>
                {stats?.priceChange24h != null ? `${stats.priceChange24h >= 0 ? '+' : ''}${stats.priceChange24h.toFixed(1)}% (24h)` : '—'}
              </div>
            </div>
            <div className="hs">
              <div className="hl">Market Cap</div>
              <div className="hv">{fmtMoney(stats?.marketCap ?? null)}</div>
              <div className="hsub" style={{ color: 'var(--p-sub)' }}>Fully Diluted</div>
            </div>
            <div className="hs">
              <div className="hl">Vol 24h</div>
              <div className="hv">{fmtMoney(stats?.volume24h ?? null)}</div>
              <div className="hsub" style={{ color: 'var(--p-sub)' }}>—</div>
            </div>
            <div className="hs">
              <div className="hl">Holders</div>
              <div className="hv">{stats?.holders?.toLocaleString() || '—'}</div>
              <div className="hsub" style={{ color: 'var(--p-sub)' }}>Wallets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

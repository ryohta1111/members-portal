'use client'

import { useEffect, useState, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MiniChart } from './MiniChart'
import { useCountUp } from '@/hooks/useCountUp'

const MINT = 'CLD7wRUSwM68q51ayc1wt4Yipc6b2fwLqVm7Rv4Dpump'

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
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const holdersCount = useCountUp(stats?.holders || 0, 1200, statsVisible)

  useEffect(() => {
    fetch('/api/035hp-stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: 'var(--p-surface)', borderBottom: '0.5px solid var(--p-border-mid)' }}>
      <div className="wrap">
        <div className="hero">
          <div className="hero-stagger">
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
          <div ref={statsRef} className={`p-fade-in ${statsVisible ? 'p-visible' : ''}`}>
            <div className="hstats">
              <div className="hs p-delay-1">
                <div className="hl">Price</div>
                <div className="hv">{stats?.price || '—'}</div>
                <div className={`hsub ${stats?.priceChange24h != null && stats.priceChange24h >= 0 ? 'up2' : 'dn2'}`}>
                  {stats?.priceChange24h != null ? `${stats.priceChange24h >= 0 ? '+' : ''}${stats.priceChange24h.toFixed(1)}% (24h)` : '—'}
                </div>
              </div>
              <div className="hs p-delay-2">
                <div className="hl">Market Cap</div>
                <div className="hv">{fmtMoney(stats?.marketCap ?? null)}</div>
                <div className="hsub" style={{ color: 'var(--p-sub)' }}>Fully Diluted</div>
              </div>
              <div className="hs p-delay-3">
                <div className="hl">Vol 24h</div>
                <div className="hv">{fmtMoney(stats?.volume24h ?? null)}</div>
                <div className="hsub" style={{ color: 'var(--p-sub)' }}>—</div>
              </div>
              <div className="hs p-delay-4">
                <div className="hl">Holders</div>
                <div className="hv" suppressHydrationWarning>{statsVisible ? holdersCount.toLocaleString() : '—'}</div>
                <div className="hsub" style={{ color: 'var(--p-sub)' }}>Wallets</div>
              </div>
            </div>

            {/* Chart */}
            <div className="hs hero-chart" style={{ marginTop: 10 }}>
              <MiniChart mint={MINT} up={(stats?.priceChange24h ?? 0) >= 0} />
            </div>

            {/* CA + Links */}
            <div className="hero-meta" style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <div className="hero-ca" onClick={() => { navigator.clipboard.writeText(MINT) }}>
                <span className="hl" style={{ marginBottom: 0, fontSize: 10 }}>CA</span>
                <span className="hero-ca-addr">{MINT.slice(0, 6)}...{MINT.slice(-4)}</span>
                <span className="hero-ca-copy">Copy</span>
              </div>
              <div className="hero-links">
                <a href={`https://pump.fun/coin/${MINT}`} target="_blank" rel="noopener noreferrer" className="tlink">pump.fun</a>
                <a href={`https://dexscreener.com/solana/${MINT}`} target="_blank" rel="noopener noreferrer" className="tlink">DexScreener</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

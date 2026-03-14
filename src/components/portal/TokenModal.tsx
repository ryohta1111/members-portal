'use client'

import { useEffect, useState } from 'react'
import { MiniChart } from './MiniChart'

interface TokenModalProps {
  token: {
    id: string
    name: string
    ticker: string
    mint_address: string | null
    price: string | null
    priceChange24h: number | null
    marketCap: number | null
    volume24h: number | null
    links: { platform: string; url: string }[]
  }
  onClose: () => void
}

function fmtMC(val: number | null) {
  if (val == null) return '—'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

export function TokenModal({ token, onClose }: TokenModalProps) {
  const [copied, setCopied] = useState(false)
  const sym = token.ticker.replace('$', '').slice(0, 3).toUpperCase()
  const isUp = token.priceChange24h != null && token.priceChange24h >= 0

  const pumpLink = token.links.find(l => l.platform === 'pumpfun')
  const dexLink = token.links.find(l => l.platform === 'dexscreener')

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function copyMint() {
    if (!token.mint_address) return
    navigator.clipboard.writeText(token.mint_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="tmod-overlay" onClick={onClose}>
      <div className="tmod" onClick={e => e.stopPropagation()}>
        <button className="tmod-close" onClick={onClose}>×</button>

        <div className="tmod-header">
          <div className="tmod-logo">{sym}</div>
          <div>
            <div className="tmod-name">{token.ticker}</div>
            <div className="tmod-sub">{token.name}</div>
          </div>
        </div>

        <div className="tmod-stats">
          <div className="tmod-stat">
            <div className="tmod-label">Price</div>
            <div className="tmod-val">{token.price || '—'}</div>
          </div>
          <div className="tmod-stat">
            <div className="tmod-label">24h</div>
            <div className={`tmod-val ${isUp ? 'up2' : 'dn2'}`}>
              {token.priceChange24h != null
                ? `${isUp ? '+' : ''}${token.priceChange24h.toFixed(1)}%`
                : '—'}
            </div>
          </div>
          <div className="tmod-stat">
            <div className="tmod-label">Market Cap</div>
            <div className="tmod-val">{fmtMC(token.marketCap)}</div>
          </div>
          <div className="tmod-stat">
            <div className="tmod-label">Volume 24h</div>
            <div className="tmod-val">{fmtMC(token.volume24h)}</div>
          </div>
        </div>

        <div className="tmod-chart">
          <MiniChart mint={token.mint_address} up={isUp} />
        </div>

        {token.mint_address && (
          <div className="tmod-mint" onClick={copyMint}>
            <span className="tmod-mint-label">Mint</span>
            <span className="tmod-mint-addr">{token.mint_address.slice(0, 16)}...{token.mint_address.slice(-8)}</span>
            <span className="tmod-mint-copy">{copied ? 'Copied!' : 'Copy'}</span>
          </div>
        )}

        <div className="tmod-links">
          {pumpLink && (
            <a className="tmod-btn" href={pumpLink.url} target="_blank" rel="noopener noreferrer">
              pump.fun
            </a>
          )}
          {dexLink && (
            <a className="tmod-btn" href={dexLink.url} target="_blank" rel="noopener noreferrer">
              Dexscreener
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

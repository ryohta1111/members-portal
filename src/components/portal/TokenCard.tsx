'use client'

import { MiniChart } from './MiniChart'

export interface TokenData {
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

interface TokenCardProps {
  token: TokenData
  onClick?: () => void
}

function fmtMC(val: number | null) {
  if (val == null) return '—'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

export function TokenCard({ token, onClick }: TokenCardProps) {
  const sym = token.ticker.replace('$', '').slice(0, 3).toUpperCase()
  const isUp = token.priceChange24h != null && token.priceChange24h >= 0

  const pumpLink = token.links.find(l => l.platform === 'pumpfun')
  const dexLink = token.links.find(l => l.platform === 'dexscreener')

  return (
    <div className="tok" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="tok-top">
        <div className="tlogo">{sym}</div>
        <div>
          <div className="tname">{token.ticker}</div>
          <div className="tsym">{sym}</div>
        </div>
      </div>
      <div className="tprice">{token.price || '—'}</div>
      <div className={`tchg ${isUp ? 'up2' : 'dn2'}`}>
        {token.priceChange24h != null
          ? `${isUp ? '+' : ''}${token.priceChange24h.toFixed(1)}%`
          : '—'}
      </div>
      <div className="tmc">MC {fmtMC(token.marketCap)}</div>
      <MiniChart mint={token.mint_address} up={isUp} />
      <div className="tlinks">
        {pumpLink ? (
          <a className="tlink" href={pumpLink.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>pump</a>
        ) : (
          <span className="tlink" style={{ opacity: 0.4 }}>pump</span>
        )}
        {dexLink ? (
          <a className="tlink" href={dexLink.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>dex</a>
        ) : (
          <span className="tlink" style={{ opacity: 0.4 }}>dex</span>
        )}
      </div>
    </div>
  )
}

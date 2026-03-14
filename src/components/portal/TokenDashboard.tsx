'use client'

import { useEffect, useState } from 'react'
import { TokenCard } from './TokenCard'
import type { TokenData } from './TokenCard'
import { BannerCard } from './BannerCard'
import { TokenModal } from './TokenModal'

type SortTab = 'all' | 'trending' | 'new' | 'mcap'

interface Token {
  id: string
  name: string
  ticker: string
  mint_address: string | null
  sort_order: number
  price: string | null
  priceChange24h: number | null
  marketCap: number | null
  volume24h: number | null
  links: { platform: string; url: string }[]
}

interface Banner {
  id: string
  ticker: string
  name: string
  sort_order: number
  banner?: any
}

export function TokenDashboard() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [tab, setTab] = useState<SortTab>('all')
  const [loading, setLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)

  useEffect(() => {
    fetch('/api/tokens')
      .then(r => r.json())
      .then(d => {
        setTokens(d.tokens || [])
        setBanners(d.banners || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function sortedTokens() {
    const list = [...tokens]
    switch (tab) {
      case 'trending':
        return list.sort((a, b) => Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0))
      case 'new':
        return list.reverse()
      case 'mcap':
        return list.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      default:
        return list
    }
  }

  // Build mixed grid: insert banners at their sort_order positions
  function buildGrid() {
    const sorted = sortedTokens()
    const bannerMap: Record<number, Banner[]> = {}
    banners.forEach(b => {
      if (b.banner) {
        if (!bannerMap[b.sort_order]) bannerMap[b.sort_order] = []
        bannerMap[b.sort_order].push(b)
      }
    })

    const items: React.ReactNode[] = []
    sorted.forEach((t, i) => {
      items.push(<TokenCard key={t.id} token={t} onClick={() => setSelectedToken(t)} />)
      // Check if banners should be inserted after this position
      if (bannerMap[i + 1]) {
        bannerMap[i + 1].forEach(b => {
          items.push(<BannerCard key={`banner-${b.id}`} data={b} />)
        })
      }
    })
    return items
  }

  const TABS: { key: SortTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'trending', label: 'Trending' },
    { key: 'new', label: 'New' },
    { key: 'mcap', label: 'Market Cap' },
  ]

  return (
    <div id="tokens" style={{ background: 'var(--p-surface)' }}>
      <div className="wrap">
        <div className="p-sec">
          <div className="sh">
            <div>
              <div className="st">Token Dashboard</div>
              <div className="ss">All listed projects — banners are paid placements.</div>
            </div>
            <a href="#" className="sl">掲載を申し込む →</a>
          </div>
          <div className="ctabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`ct ${tab === t.key ? 'on' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--p-sub)', fontSize: 12 }}>読み込み中...</div>
          ) : tokens.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--p-sub)', fontSize: 12 }}>トークンデータなし</div>
          ) : (
            <div className="mix-grid">
              {buildGrid()}
            </div>
          )}
          {selectedToken && (
            <TokenModal token={selectedToken} onClose={() => setSelectedToken(null)} />
          )}
        </div>
      </div>
    </div>
  )
}

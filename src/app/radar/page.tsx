'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { RadarIntro } from '@/components/radar/RadarIntro'
import { UsernameModal } from '@/components/radar/UsernameModal'
import { EventBanner } from '@/components/radar/EventBanner'
import { EventTabs } from '@/components/radar/EventTabs'
import { KpiGrid } from '@/components/radar/KpiGrid'
import { ContentTabs } from '@/components/radar/ContentTabs'
import { CountryList } from '@/components/radar/CountryList'
import { RankingTable } from '@/components/radar/RankingTable'
import Link from 'next/link'
import './radar.css'

const HELIUS_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || ''
const TOKEN_MINT = 'CLD7wRUSwM68q51ayc1wt4Yipc6b2fwLqVm7Rv4Dpump'
const INTRO_KEY = 'radar_intro_shown'

type GateStep = 'loading' | 'connect' | 'checking' | 'denied' | 'username' | 'intro' | 'ready'

interface Event {
  id: string
  title: string
  hashtags: string[]
  start_at: string
  end_at: string
  is_active: boolean
}

export default function RadarPage() {
  const { publicKey, connected } = useWallet()
  const [step, setStep] = useState<GateStep>('loading')
  const [xUsername, setXUsername] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [contentTab, setContentTab] = useState('map')
  const [summary, setSummary] = useState({ totalPosts: 0, totalReach: 0, countries: 0, users: 0 })
  const [mapData, setMapData] = useState<{ country_code: string; count: number }[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)

  const walletAddr = publicKey?.toString() || ''

  // Check token balance
  const checkBalance = useCallback(async (addr: string) => {
    setStep('checking')
    try {
      const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTokenAccountsByOwner',
          params: [addr, { mint: TOKEN_MINT }, { encoding: 'jsonParsed' }],
        }),
      })
      const json = await res.json()
      const accs = json.result?.value || []
      const bal = accs.reduce((t: number, a: any) =>
        t + parseFloat(a.account?.data?.parsed?.info?.tokenAmount?.uiAmountString || '0'), 0)

      if (bal < 1) { setStep('denied'); return }

      // Check if user has registered X username
      const meRes = await fetch(`/api/radar/me?wallet=${addr}`)
      const meData = await meRes.json()

      if (meData.registered && meData.x_username) {
        setXUsername(meData.x_username)
        if (meData.score?.rank) setMyRank(meData.score.rank)
        // Check intro
        const shown = sessionStorage.getItem(INTRO_KEY)
        if (shown) { setStep('ready') } else { setStep('intro') }
      } else {
        setStep('username')
      }
    } catch {
      setStep('denied')
    }
  }, [])

  useEffect(() => {
    if (connected && publicKey) {
      checkBalance(publicKey.toString())
    } else {
      setStep('connect')
    }
  }, [connected, publicKey, checkBalance])

  // Fetch events
  useEffect(() => {
    fetch('/api/radar/events')
      .then(r => r.json())
      .then(d => {
        setEvents(d.events || [])
        if (d.active) {
          setActiveEvent(d.active)
          setSelectedEventId(d.active.id)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch data when event changes
  useEffect(() => {
    if (step !== 'ready') return
    const params = selectedEventId ? `?event_id=${selectedEventId}` : ''

    fetch(`/api/radar/summary${params}`)
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(() => {})

    fetch(`/api/radar/map${params}`)
      .then(r => r.json())
      .then(d => setMapData(Array.isArray(d) ? d : []))
      .catch(() => {})

    fetch(`/api/radar/ranking${params}`)
      .then(r => r.json())
      .then(d => setRanking(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [step, selectedEventId])

  // ─── LOADING ───
  if (step === 'loading') {
    return <div className="radar-page"><div className="radar-gate"><div className="v-spinner" /></div></div>
  }

  // ─── CONNECT ───
  if (step === 'connect') {
    return (
      <div className="radar-page">
        <div className="radar-gate">
          <h2>CT Radar</h2>
          <p>ウォレットを接続してアクセスしてください</p>
          <WalletMultiButton />
        </div>
      </div>
    )
  }

  // ─── CHECKING ───
  if (step === 'checking') {
    return (
      <div className="radar-page">
        <div className="radar-gate">
          <div className="v-spinner" />
          <p>トークン残高を確認中...</p>
        </div>
      </div>
    )
  }

  // ─── DENIED ───
  if (step === 'denied') {
    return (
      <div className="radar-page">
        <div className="radar-gate">
          <h2>035HP Required</h2>
          <p>CT Radarにアクセスするには$035HPトークンを1枚以上保有している必要があります。</p>
          <a href={`https://pump.fun/coin/${TOKEN_MINT}`} target="_blank" rel="noopener noreferrer" className="radar-gate-btn">
            $035HPを購入する
          </a>
        </div>
      </div>
    )
  }

  // ─── USERNAME MODAL ───
  if (step === 'username') {
    return (
      <div className="radar-page">
        <UsernameModal
          walletAddress={walletAddr}
          onDone={(username) => {
            setXUsername(username)
            const shown = sessionStorage.getItem(INTRO_KEY)
            if (shown) { setStep('ready') } else { setStep('intro') }
          }}
          onSkip={() => {
            const shown = sessionStorage.getItem(INTRO_KEY)
            if (shown) { setStep('ready') } else { setStep('intro') }
          }}
        />
      </div>
    )
  }

  // ─── INTRO ANIMATION ───
  if (step === 'intro') {
    return (
      <div className="radar-page">
        <RadarIntro onDone={() => {
          sessionStorage.setItem(INTRO_KEY, '1')
          setStep('ready')
        }} />
      </div>
    )
  }

  // ─── MAIN ───
  return (
    <div className="radar-page">
      <EventBanner event={activeEvent} />

      <div className="radar-hero">
        <h1>CT Radar</h1>
        <div className="radar-hero-sub">
          {activeEvent ? `#${activeEvent.hashtags?.[0]?.replace('#', '') || '035HP'}` : '#035HP'} · 最終更新 1時間前
        </div>
        <EventTabs
          events={events}
          selectedId={selectedEventId}
          onSelect={setSelectedEventId}
        />
      </div>

      <KpiGrid
        totalPosts={summary.totalPosts}
        totalReach={summary.totalReach}
        countries={summary.countries}
        users={summary.users}
        myRank={myRank}
      />

      <ContentTabs active={contentTab} onChange={setContentTab} />

      {contentTab === 'map' && (
        <div className="radar-map-layout">
          <div className="radar-map-wrap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--radar-muted)', fontSize: 14 }}>
              世界地図（D3.js — Phase 1 実装予定）
            </div>
          </div>
          <CountryList data={mapData} />
        </div>
      )}

      {contentTab === 'ranking' && (
        <RankingTable data={ranking} myUsername={xUsername} />
      )}
    </div>
  )
}

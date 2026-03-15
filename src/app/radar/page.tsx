'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { RadarIntro } from '@/components/radar/RadarIntro'
import { UsernameModal } from '@/components/radar/UsernameModal'
import { EventBanner } from '@/components/radar/EventBanner'
import { EventTabs } from '@/components/radar/EventTabs'
import { KpiGrid } from '@/components/radar/KpiGrid'
import { PowerScore } from '@/components/radar/PowerScore'
import { ContentTabs } from '@/components/radar/ContentTabs'
import { MapView } from '@/components/radar/MapView'
import { CountryList } from '@/components/radar/CountryList'
import { RankingTable } from '@/components/radar/RankingTable'
import { NetworkView } from '@/components/radar/NetworkView'
import { BuzzFeed } from '@/components/radar/BuzzFeed'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './radar.css'

const HELIUS_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || ''
const TOKEN_MINT = 'CLD7wRUSwM68q51ayc1wt4Yipc6b2fwLqVm7Rv4Dpump'
const INTRO_KEY = 'radar_intro_shown'

type GateStep = 'loading' | 'connect' | 'checking' | 'denied' | 'username' | 'intro' | 'ready'

interface Event { id: string; title: string; hashtags: string[]; start_at: string; end_at: string; is_active: boolean }

const NAV_LINKS = [
  { href: '/', label: 'Portal' },
  { href: '/radar', label: 'Radar' },
  { href: '/vote', label: 'Vote' },
  { href: '/staking', label: 'Staking' },
  { href: '/game', label: 'Game' },
]

export default function RadarPage() {
  const { publicKey, connected } = useWallet()
  const pathname = usePathname()
  const [step, setStep] = useState<GateStep>('loading')
  const [introFade, setIntroFade] = useState(false)
  const [xUsername, setXUsername] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [summary, setSummary] = useState({ totalPosts: 0, totalReach: 0, countries: 0, users: 0 })
  const [mapData, setMapData] = useState<{ country_code: string; count: number }[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [networkNodes, setNetworkNodes] = useState<any[]>([])
  const [networkLinks, setNetworkLinks] = useState<any[]>([])
  const [buzzPosts, setBuzzPosts] = useState<any[]>([])
  const [myXId, setMyXId] = useState<string | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myScore, setMyScore] = useState<any>(null)

  const walletAddr = publicKey?.toString() || ''
  const shortAddr = walletAddr ? `${walletAddr.slice(0, 4)}...${walletAddr.slice(-4)}` : ''

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

      const meRes = await fetch(`/api/radar/me?wallet=${addr}`)
      const meData = await meRes.json()
      if (meData.registered && meData.x_username) {
        setXUsername(meData.x_username)
        if (meData.score?.rank) setMyRank(meData.score.rank)
        if (meData.score) setMyScore(meData.score)
        if (meData.x_id) setMyXId(meData.x_id)
        const shown = sessionStorage.getItem(INTRO_KEY)
        setStep(shown ? 'ready' : 'intro')
      } else {
        setStep('username')
      }
    } catch { setStep('denied') }
  }, [])

  useEffect(() => {
    if (connected && publicKey) { checkBalance(publicKey.toString()) }
    else { setStep('connect') }
  }, [connected, publicKey, checkBalance])

  useEffect(() => {
    fetch('/api/radar/events').then(r => r.json()).then(d => {
      setEvents(d.events || [])
      if (d.active) { setActiveEvent(d.active); setSelectedEventId(d.active.id) }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (step !== 'ready') return
    const params = selectedEventId ? `?event_id=${selectedEventId}` : ''
    fetch(`/api/radar/summary${params}`).then(r => r.json()).then(setSummary).catch(() => {})
    fetch(`/api/radar/map${params}`).then(r => r.json()).then(d => setMapData(Array.isArray(d) ? d : [])).catch(() => {})
    fetch(`/api/radar/ranking${params}`).then(r => r.json()).then(d => setRanking(Array.isArray(d) ? d : [])).catch(() => {})
    fetch(`/api/radar/buzz${params}`).then(r => r.json()).then(d => setBuzzPosts(Array.isArray(d) ? d : [])).catch(() => {})
    const netParams = myXId ? `${params}${params ? '&' : '?'}my_x_id=${myXId}` : params
    fetch(`/api/radar/network${netParams}`).then(r => r.json()).then(d => {
      setNetworkNodes((d.nodes || []).map((n: any) => ({ ...n, isMe: myXId ? n.id === myXId : false })))
      setNetworkLinks(d.links || [])
    }).catch(() => {})
  }, [step, selectedEventId, myXId])

  // GATE SCREENS
  if (step === 'loading') {
    return <div className="radar-page"><div className="radar-gate"><p style={{ color: 'var(--radar-muted)' }}>読み込み中...</p></div></div>
  }
  if (step === 'connect') {
    return <div className="radar-page"><div className="radar-gate"><h2>CT Radar</h2><p>ウォレットを接続してアクセスしてください</p><WalletMultiButton /></div></div>
  }
  if (step === 'checking') {
    return <div className="radar-page"><div className="radar-gate"><p>トークン残高を確認中...</p></div></div>
  }
  if (step === 'denied') {
    return (
      <div className="radar-page"><div className="radar-gate">
        <h2>035HP Required</h2>
        <p>CT Radarにアクセスするには$035HPトークンを1枚以上保有している必要があります。</p>
        <a href={`https://pump.fun/coin/${TOKEN_MINT}`} target="_blank" rel="noopener noreferrer" className="radar-gate-btn">$035HPを購入する</a>
      </div></div>
    )
  }
  if (step === 'username') {
    return (
      <div className="radar-page">
        <UsernameModal walletAddress={walletAddr}
          onDone={(u) => { setXUsername(u); setStep(sessionStorage.getItem(INTRO_KEY) ? 'ready' : 'intro') }}
          onSkip={() => setStep(sessionStorage.getItem(INTRO_KEY) ? 'ready' : 'intro')}
        />
      </div>
    )
  }
  if (step === 'intro') {
    return (
      <div className="radar-page">
        <RadarIntro onDone={() => {}} />
        {/* Auto-transition after 3.9s */}
        <AutoTransition onDone={() => { sessionStorage.setItem(INTRO_KEY, '1'); setStep('ready') }} delay={4200} />
      </div>
    )
  }

  // MAIN
  const selectedEvent = events.find(e => e.id === selectedEventId)
  const hashtags = selectedEvent?.hashtags?.map(h => h.replace('#', '')).join(' \u00B7 #') || '035HP'

  return (
    <div className="radar-page">
      {/* NAV */}
      <nav className="r-nav">
        <Link href="/" className="r-nav-logo">035<span className="r-acc">HP!</span></Link>
        <ul className="r-nav-links">
          {NAV_LINKS.map(l => (
            <li key={l.href}><Link href={l.href} className={pathname === l.href ? 'active' : ''}>{l.label}</Link></li>
          ))}
        </ul>
        <div className="r-wallet-chip">
          <div className="r-wallet-dot" />
          <span>{xUsername || shortAddr}</span>
        </div>
      </nav>

      <EventBanner event={activeEvent} />

      <div className="r-hero">
        <h1 className="r-hero-title">CT <span className="r-acc">Radar</span></h1>
        <p className="r-hero-subtitle">#{hashtags} — 最終更新 1時間前</p>
        <EventTabs events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} />
        <KpiGrid totalPosts={summary.totalPosts} totalReach={summary.totalReach} countries={summary.countries} users={summary.users} myRank={myRank} totalUsers={summary.users} />
        <PowerScore data={myScore ? {
          score: myScore.score || 0, rank: myScore.rank, totalUsers: summary.users,
          follower_score: myScore.follower_score || 0, post_score: myScore.post_score || 0,
          like_score: myScore.like_score || 0, rt_score: myScore.rt_score || 0,
          intl_bonus: myScore.intl_bonus || 0, username: xUsername || '',
        } : null} />
      </div>

      <ContentTabs />

      <div className="r-content">
        {/* 世界地図 */}
        <div id="map" className="r-panels-grid">
          <MapView data={mapData} />
          <CountryList data={mapData} />
        </div>

        {/* ネットワーク図 */}
        <div id="network" className="r-panels-grid">
          <NetworkView nodes={networkNodes} links={networkLinks} myXId={myXId || undefined} />
          <div id="ranking">
            <RankingTable data={ranking} myUsername={xUsername} eventTitle={selectedEvent?.title || '全期間'} />
          </div>
        </div>

        {/* バズ投稿 */}
        <BuzzFeed data={buzzPosts} myUsername={xUsername} />

      </div>
    </div>
  )
}

// Helper: auto-transition component
function AutoTransition({ onDone, delay }: { onDone: () => void; delay: number }) {
  useEffect(() => {
    const timer = setTimeout(onDone, delay)
    return () => clearTimeout(timer)
  }, [onDone, delay])
  return null
}

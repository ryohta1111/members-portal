'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Header } from '@/components/portal/Header'
import { StakingCard } from '@/components/staking/StakingCard'
import { fetcher } from '@/lib/fetcher'

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'festival', label: 'Festival' },
  { key: 'standard', label: 'Normal' },
  { key: 'event', label: 'Event' },
]

function fmtAmount(raw: number, dec: number) {
  return (raw / Math.pow(10, dec)).toLocaleString()
}

export default function StakingListPage() {
  const [category, setCategory] = useState<string | null>(null)
  const { publicKey, connected } = useWallet()

  const { data, isLoading } = useSWR('/api/staking/festivals', fetcher)
  const { data: statusData } = useSWR(
    publicKey ? `/api/staking/status?wallet_address=${publicKey.toBase58()}` : null,
    fetcher
  )

  const festivals = data?.festivals || []
  const myStakes = statusData?.stakes || []
  const stakedFestivalIds = new Set(myStakes.map((s: any) => s.festival_id))
  const stakeByFestival = new Map(myStakes.map((s: any) => [s.festival_id, s]))

  const filtered = category
    ? festivals.filter((f: any) => f.category === category)
    : festivals

  const dec = 6
  const activePools = festivals.filter((f: any) => f.status === 'open').length
  const totalStaked = festivals.reduce((sum: number, f: any) => sum + Number(f.total_staked || 0), 0)
  const totalRewardsPaid = festivals
    .filter((f: any) => f.status === 'paid')
    .reduce((sum: number, f: any) => sum + Math.floor(Number(f.total_staked || 0) * (Number(f.multiplier) - 1)), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-7 animate-fade-in-up">
          <div>
            <Link href="/" className="text-sm text-[var(--text-sub)] hover:text-[var(--text)] mb-2 inline-block" style={{ textDecoration: 'none' }}>← ポータルに戻る</Link>
            <h1 className="text-[28px] font-semibold tracking-tight">Staking</h1>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-7 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          {[
            { label: 'Total Staked', value: `${fmtAmount(totalStaked, dec)} 035HP` },
            { label: 'Active Pools', value: String(activePools) },
            { label: 'Rewards Paid', value: `${fmtAmount(totalRewardsPaid, dec)} 035HP` },
          ].map((c) => (
            <div key={c.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
              <p className="text-xs text-[var(--text-sub)] mb-1.5 font-medium">{c.label}</p>
              <p className="text-xl font-bold font-mono">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-7 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key || 'all'}
              onClick={() => setCategory(c.key)}
              className={`text-[13px] font-medium px-4 py-2 rounded-full border-[1.5px] transition-all whitespace-nowrap ${
                category === c.key
                  ? 'bg-[var(--text)] text-white border-[var(--text)]'
                  : 'bg-[var(--surface)] text-[var(--text-sub)] border-[var(--border)] hover:border-[#999] hover:text-[var(--text)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center text-[var(--text-sub)] py-16 text-sm">読み込み中...</div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f: any, idx: number) => (
            <div key={f.id} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + idx * 0.06}s` }}>
              <StakingCard
                festival={f}
                isStaked={stakedFestivalIds.has(f.id)}
                isClaimed={(stakeByFestival.get(f.id) as any)?.claimed || false}
                walletConnected={connected}
              />
            </div>
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-[var(--text-sub)] py-16 text-sm">
            ステーキングプールはまだありません
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '24px 32px', textAlign: 'center', fontSize: 12, color: '#807D76',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        2025 035HP Community · <a href="https://members.035hp.jp" style={{ color: '#807D76' }}>members.035hp.jp</a>
      </div>
    </div>
  )
}

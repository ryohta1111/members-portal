'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { StakingCard } from '@/components/staking/StakingCard'
import { fetcher } from '@/lib/fetcher'

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'festival', label: 'Festival' },
  { key: 'standard', label: 'Normal' },
  { key: 'event', label: 'Event' },
]

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

  // サマリー計算
  const activePools = festivals.filter((f: any) => f.status === 'open').length
  const totalStaked = festivals.reduce((sum: number, f: any) => sum + Number(f.total_staked || 0), 0)
  const totalRewardsPaid = festivals
    .filter((f: any) => f.status === 'paid')
    .reduce((sum: number, f: any) => sum + Math.floor(Number(f.total_staked || 0) * (Number(f.multiplier) - 1)), 0)

  // decimals（とりあえず6で統一表示）
  const dec = 6
  const fmtAmount = (raw: number) => (raw / Math.pow(10, dec)).toLocaleString()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Staking</h1>
          <WalletMultiButton style={{
            fontSize: '14px',
            height: '40px',
            borderRadius: '9999px',
            background: '#f0f0f5',
            color: '#3b82f6',
            border: '1px solid #e5e5e5',
          }} />
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-xs text-[#888] mb-1">Total Staked</p>
            <p className="text-xl font-bold font-mono">{fmtAmount(totalStaked)} 035HP</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-xs text-[#888] mb-1">Active Pools</p>
            <p className="text-xl font-bold font-mono">{activePools}</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-xs text-[#888] mb-1">Rewards Paid</p>
            <p className="text-xl font-bold font-mono">{fmtAmount(totalRewardsPaid)} 035HP</p>
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.key || 'all'}
              onClick={() => setCategory(c.key)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                category === c.key
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-[#888] border-[#e5e5e5] hover:text-[#1a1a1a]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-[#888] py-12">読み込み中...</div>
        )}

        {/* カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f: any) => (
            <StakingCard
              key={f.id}
              festival={f}
              isStaked={stakedFestivalIds.has(f.id)}
              isClaimed={(stakeByFestival.get(f.id) as any)?.claimed || false}
              walletConnected={connected}
            />
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-[#888] py-12">
            ステーキングはまだありません
          </div>
        )}
      </div>
    </div>
  )
}

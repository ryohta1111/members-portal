'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { StakingCard } from '@/components/staking/StakingCard'
import { fetcher } from '@/lib/fetcher'

const CATEGORIES = [
  { key: null, label: '全て' },
  { key: 'festival', label: '🎪 祭り' },
  { key: 'standard', label: '📦 通常' },
  { key: 'event', label: '⚡ イベント' },
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

  // カテゴリフィルター
  const filtered = category
    ? festivals.filter((f: any) => f.category === category)
    : festivals

  const open = filtered.filter((f: any) => f.status === 'open')
  const upcoming = filtered.filter((f: any) => f.status === 'upcoming')
  const ended = filtered.filter((f: any) => f.status === 'closed' || f.status === 'paid')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Staking</h1>
          <WalletMultiButton style={{ fontSize: '14px', height: '36px' }} />
        </div>
        <p className="text-[#888] text-sm mb-6">
          035HPトークンをロックして報酬を受け取ろう
        </p>

        {/* カテゴリタブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key || 'all'}
              onClick={() => setCategory(c.key)}
              className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                category === c.key
                  ? 'bg-white text-black'
                  : 'bg-[#111] text-[#888] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-[#888] py-12">読み込み中...</div>
        )}

        {/* 開催中 */}
        {open.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm text-[#888] font-bold mb-3">開催中</h2>
            <div className="space-y-3">
              {open.map((f: any) => (
                <StakingCard
                  key={f.id}
                  festival={f}
                  isStaked={stakedFestivalIds.has(f.id)}
                  walletConnected={connected}
                />
              ))}
            </div>
          </section>
        )}

        {/* 予定 */}
        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm text-[#888] font-bold mb-3">予定</h2>
            <div className="space-y-3">
              {upcoming.map((f: any) => (
                <StakingCard
                  key={f.id}
                  festival={f}
                  isStaked={stakedFestivalIds.has(f.id)}
                  walletConnected={connected}
                />
              ))}
            </div>
          </section>
        )}

        {/* 終了済み */}
        {ended.length > 0 && (
          <section className="mb-8">
            <details>
              <summary className="text-sm text-[#888] font-bold mb-3 cursor-pointer">
                終了済み（{ended.length}）
              </summary>
              <div className="space-y-3 mt-3">
                {ended.map((f: any) => (
                  <StakingCard
                    key={f.id}
                    festival={f}
                    isStaked={stakedFestivalIds.has(f.id)}
                    walletConnected={connected}
                  />
                ))}
              </div>
            </details>
          </section>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-[#888] py-12">
            ステーキングはまだありません
          </div>
        )}
      </div>
    </div>
  )
}

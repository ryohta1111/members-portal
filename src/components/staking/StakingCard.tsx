'use client'

import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { CategoryBadge } from './CategoryBadge'
import { ProgressBar } from './ProgressBar'

interface Festival {
  id: string
  title: string
  token_symbol: string
  category: string
  status: string
  multiplier: number
  max_stake_cap: number
  decimals: number
  start_at: string
  end_at: string
  total_staked: number
}

interface StakingCardProps {
  festival: Festival
  isStaked?: boolean
  walletConnected?: boolean
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function StakingCard({ festival, isStaked, walletConnected }: StakingCardProps) {
  const f = festival

  let btnLabel = 'ステークする →'
  let btnClass = 'bg-white text-black hover:bg-gray-200'
  let disabled = false

  if (isStaked) {
    btnLabel = '✓ ステーク済み'
    btnClass = 'bg-green-600/20 text-green-400 border border-green-600/40'
    disabled = false // 詳細は見れる
  } else if (!walletConnected) {
    btnLabel = 'ウォレットを接続'
    btnClass = 'bg-[#222] text-[#888]'
  } else if (f.status === 'upcoming') {
    btnLabel = '開始待ち'
    btnClass = 'bg-[#222] text-[#888] cursor-not-allowed'
    disabled = true
  } else if (f.status === 'closed' || f.status === 'paid') {
    btnLabel = '終了'
    btnClass = 'bg-[#222] text-[#888] cursor-not-allowed'
    disabled = true
  }

  const inner = (
    <div className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <CategoryBadge category={f.category} />
          <StatusBadge status={f.status} />
        </div>
        <span className="text-sm text-[#888]">{f.token_symbol}</span>
      </div>

      <h3 className="text-lg font-bold mb-3">{f.title}</h3>

      <div className="flex gap-6 text-sm text-[#888] mb-3">
        <span>倍率 <span className="text-white font-mono">×{f.multiplier}</span></span>
        <span>{fmtDate(f.start_at)} 〜 {fmtDate(f.end_at)}</span>
      </div>

      <ProgressBar
        current={f.total_staked}
        max={f.max_stake_cap}
        decimals={f.decimals}
        symbol={f.token_symbol}
      />

      <div className="mt-3">
        <span className={`inline-block text-sm font-bold px-4 py-2 rounded ${btnClass}`}>
          {btnLabel}
        </span>
      </div>
    </div>
  )

  if (disabled) return inner

  return <Link href={`/staking/${f.id}`}>{inner}</Link>
}

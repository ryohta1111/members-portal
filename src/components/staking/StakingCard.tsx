'use client'

import Link from 'next/link'

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

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

export function StakingCard({ festival, isStaked, walletConnected }: StakingCardProps) {
  const f = festival
  const apr = Math.round((f.multiplier - 1) * 100)

  let btnLabel = 'Stake'
  let btnClass = 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
  let disabled = false

  if (isStaked) {
    btnLabel = 'Staked ✓'
    btnClass = 'bg-[#16a34a] text-white'
  } else if (!walletConnected) {
    btnLabel = 'Connect'
    btnClass = 'bg-[#e5e5e5] text-[#888]'
  } else if (f.status === 'upcoming') {
    btnLabel = 'Soon'
    btnClass = 'bg-[#e5e5e5] text-[#888] cursor-not-allowed'
    disabled = true
  } else if (f.status === 'closed' || f.status === 'paid') {
    btnLabel = 'Ended'
    btnClass = 'bg-[#e5e5e5] text-[#888] cursor-not-allowed'
    disabled = true
  }

  const inner = (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold mb-1">{f.title}</h3>

      <p className="text-3xl font-bold text-[#16a34a] mb-3">
        APR {apr}%
      </p>

      <div className="flex items-end justify-between">
        <div className="text-sm text-[#888] space-y-0.5">
          <div>
            <span className="inline-block w-16">Capacity</span>
            <span className="text-[#1a1a1a] font-mono">
              {fmtAmount(f.total_staked, f.decimals)} / {fmtAmount(f.max_stake_cap, f.decimals)}
            </span>
          </div>
          <div>
            <span className="inline-block w-16">Period</span>
            <span className="text-[#1a1a1a]">
              {fmtDate(f.start_at)} - {fmtDate(f.end_at)}
            </span>
          </div>
        </div>

        <span className={`inline-block text-sm font-bold px-5 py-2 rounded-full ${btnClass}`}>
          {btnLabel}
        </span>
      </div>
    </div>
  )

  if (disabled) return inner

  return <Link href={`/staking/${f.id}`}>{inner}</Link>
}

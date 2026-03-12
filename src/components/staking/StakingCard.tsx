'use client'

import Link from 'next/link'
import { useCountUp } from './useCountUp'

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
  isClaimed?: boolean
  walletConnected?: boolean
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

type BtnState = {
  label: string
  cls: string
  href: string
}

function getBtnState(f: Festival, isStaked?: boolean, isClaimed?: boolean, walletConnected?: boolean): BtnState {
  const detail = `/staking/${f.id}`
  const claim = `/staking/claim/${f.id}`

  if (isStaked && f.status === 'paid' && !isClaimed) {
    return { label: 'Receive', cls: 'bg-[var(--orange)] text-white', href: claim }
  }
  if (isStaked && isClaimed) {
    return { label: 'Claimed \u2713', cls: 'bg-[var(--border)] text-[var(--text-sub)]', href: detail }
  }
  if (isStaked) {
    return { label: 'Staked \u2713', cls: 'bg-transparent text-[var(--green)] border-2 border-[var(--green)]', href: detail }
  }
  if (!walletConnected) {
    return { label: 'Connect', cls: 'bg-[var(--border)] text-[var(--text-sub)]', href: detail }
  }
  if (f.status === 'open') {
    const now = Date.now()
    const inPeriod = now >= new Date(f.start_at).getTime() && now <= new Date(f.end_at).getTime()
    if (inPeriod) {
      return { label: 'Stake', cls: 'bg-[var(--blue)] text-white', href: detail }
    }
    return { label: 'View', cls: 'bg-[var(--text)] text-white', href: detail }
  }
  if (f.status === 'upcoming') {
    return { label: 'Soon', cls: 'bg-[var(--border)] text-[var(--text-sub)]', href: detail }
  }
  return { label: 'View', cls: 'bg-[var(--text)] text-white', href: detail }
}

export function StakingCard({ festival, isStaked, isClaimed, walletConnected }: StakingCardProps) {
  const f = festival
  const apr = Math.round((f.multiplier - 1) * 100)
  const animatedApr = useCountUp(apr, 1000)
  const btn = getBtnState(f, isStaked, isClaimed, walletConnected)

  return (
    <Link href={btn.href}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 hover:shadow-md transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
        <p className="text-3xl font-bold text-[var(--green)] mb-4">
          APR {animatedApr}%
        </p>
        <div className="flex items-end justify-between">
          <div className="text-sm text-[var(--text-sub)] space-y-1">
            <div>
              <span className="inline-block w-[70px] font-medium">Capacity</span>
              <span className="text-[var(--text)] font-mono font-medium">
                {fmtAmount(f.total_staked, f.decimals)} / {fmtAmount(f.max_stake_cap, f.decimals)}
              </span>
            </div>
            <div>
              <span className="inline-block w-[70px] font-medium">Period</span>
              <span className="text-[var(--text)]">
                {fmtDate(f.start_at)} - {fmtDate(f.end_at)}
              </span>
            </div>
          </div>
          <span className={`inline-block text-sm font-semibold px-5 py-2 rounded-full whitespace-nowrap ${btn.cls}`}>
            {btn.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

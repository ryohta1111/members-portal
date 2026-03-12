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
  disabled: boolean
  href: string | null
}

function getBtnState(f: Festival, isStaked?: boolean, isClaimed?: boolean, walletConnected?: boolean): BtnState {
  // 1. staked + paid + 未claim → Receive (orange)
  if (isStaked && f.status === 'paid' && !isClaimed) {
    return { label: 'Receive', cls: 'bg-[var(--orange)] text-white', disabled: false, href: `/staking/claim/${f.id}` }
  }
  // 2. staked + claimed → Claimed (gray)
  if (isStaked && isClaimed) {
    return { label: 'Claimed \u2713', cls: 'bg-[var(--border)] text-[var(--text-sub)]', disabled: true, href: null }
  }
  // 3. staked + open/closed → Staked (green outline)
  if (isStaked) {
    return { label: 'Staked \u2713', cls: 'bg-transparent text-[var(--green)] border-2 border-[var(--green)]', disabled: false, href: `/staking/${f.id}` }
  }
  // 4. wallet not connected → Connect
  if (!walletConnected) {
    return { label: 'Connect', cls: 'bg-[var(--border)] text-[var(--text-sub)]', disabled: false, href: `/staking/${f.id}` }
  }
  // 5. upcoming → Soon
  if (f.status === 'upcoming') {
    return { label: 'Soon', cls: 'bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed', disabled: true, href: null }
  }
  // 6. closed/paid (not staked) → Ended
  if (f.status === 'closed' || f.status === 'paid') {
    return { label: 'Ended', cls: 'bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed', disabled: true, href: null }
  }
  // 7. open → Stake (blue)
  return { label: 'Stake', cls: 'bg-[var(--blue)] text-white', disabled: false, href: `/staking/${f.id}` }
}

export function StakingCard({ festival, isStaked, isClaimed, walletConnected }: StakingCardProps) {
  const f = festival
  const apr = Math.round((f.multiplier - 1) * 100)
  const btn = getBtnState(f, isStaked, isClaimed, walletConnected)

  const inner = (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 hover:shadow-md transition-shadow cursor-pointer">
      <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
      <p className="text-3xl font-bold text-[var(--green)] mb-4">
        APR {apr}%
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
  )

  if (btn.disabled || !btn.href) return <div>{inner}</div>
  return <Link href={btn.href}>{inner}</Link>
}

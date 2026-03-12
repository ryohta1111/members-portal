'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction } from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { StatusBadge } from '@/components/staking/StatusBadge'
import { CategoryBadge } from '@/components/staking/CategoryBadge'
import { ProgressBar } from '@/components/staking/ProgressBar'
import { StakeModal } from '@/components/staking/StakeModal'
import { fetcher } from '@/lib/fetcher'

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

function sym(tokenSymbol: string) {
  return tokenSymbol.startsWith('$') ? tokenSymbol : `$${tokenSymbol}`
}

function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    const calc = () => setDiff(Math.max(0, new Date(targetDate).getTime() - Date.now()))
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, mins, secs, isZero: diff === 0 }
}

export default function StakingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()

  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data, mutate } = useSWR(`/api/staking/festival/${id}`, fetcher)
  const { data: statusData, mutate: mutateStatus } = useSWR(
    publicKey ? `/api/staking/status?festival_id=${id}&wallet_address=${publicKey.toBase58()}` : null,
    fetcher
  )

  const festival = data?.festival
  const myStake = statusData?.stakes?.[0]

  const countdownTarget = festival
    ? (festival.status === 'upcoming' ? festival.start_at : festival.end_at)
    : new Date().toISOString()
  const countdown = useCountdown(countdownTarget)

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-sub)]" style={{ background: 'var(--bg)' }}>
        読み込み中...
      </div>
    )
  }

  const f = festival
  const decimals = f.decimals || 6
  const apr = Math.round((f.multiplier - 1) * 100)
  const stakeCount = f.stake_count || 0
  const isClaimed = myStake?.claimed
  const isClaimable = myStake && f.status === 'paid' && !isClaimed && myStake.reward_amount
  const s = sym(f.token_symbol)

  // 期間外チェック: openでもstart_at/end_atの外なら応募不可
  const now = Date.now()
  const isOutOfPeriod = f.status === 'open' && (
    now < new Date(f.start_at).getTime() || now > new Date(f.end_at).getTime()
  )

  async function handleStake() {
    if (!publicKey || !connected) return
    setError('')
    setLoading(true)

    try {
      const inputAmount = parseFloat(amount)
      if (isNaN(inputAmount) || inputAmount <= 0) throw new Error('有効な金額を入力してください')

      const rawAmount = Math.floor(inputAmount * Math.pow(10, decimals))
      if (rawAmount < Number(f.min_stake)) throw new Error(`最低 ${fmtAmount(f.min_stake, decimals)} ${f.token_symbol} 必要です`)
      if (rawAmount > Number(f.max_stake)) throw new Error(`個人上限は ${fmtAmount(f.max_stake, decimals)} ${f.token_symbol} です`)

      const remaining = Number(f.max_stake_cap) - Number(f.total_staked)
      if (rawAmount > remaining) throw new Error(`残りキャップは ${fmtAmount(remaining, decimals)} ${f.token_symbol} です`)
      if (!f.pool_wallet) throw new Error('プールウォレットが未設定です')

      const mintPubkey = new PublicKey(f.token_mint)
      const poolPubkey = new PublicKey(f.pool_wallet)

      const mintInfo = await connection.getAccountInfo(mintPubkey)
      const tokenProgramId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID

      const fromAta = getAssociatedTokenAddressSync(mintPubkey, publicKey, false, tokenProgramId)
      const toAta = getAssociatedTokenAddressSync(mintPubkey, poolPubkey, false, tokenProgramId)

      const tx = new Transaction()
      const toAtaInfo = await connection.getAccountInfo(toAta)
      if (!toAtaInfo) {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, toAta, poolPubkey, mintPubkey, tokenProgramId))
      }
      tx.add(createTransferInstruction(fromAta, toAta, publicKey, rawAmount, [], tokenProgramId))

      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')

      const res = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festival_id: id, wallet_address: publicKey.toBase58(), amount: rawAmount, tx_hash: sig }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      mutate()
      mutateStatus()
      setAmount('')
    } catch (err: any) {
      console.error('[stake]', err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const countdownLabel = f.status === 'upcoming' ? 'Starts in' : f.status === 'open' ? 'Ends in' : ''
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/staking" className="inline-flex items-center gap-1.5 text-sm text-[var(--blue)] font-medium mb-5 hover:underline animate-fade-in-up">
          ← Staking Pools
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-7 gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-[28px] font-semibold tracking-tight">{f.title}</h1>
          <div className="flex gap-2 items-center shrink-0">
            <CategoryBadge category={f.category} />
            <StatusBadge status={f.status} />
          </div>
        </div>

        {/* Hero: 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Event image */}
          <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius)] h-[240px] flex items-center justify-center overflow-hidden">
            {f.image_url ? (
              <img src={f.image_url} alt={f.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--text-sub)] text-[13px] font-medium tracking-widest uppercase">EVENT IMAGE</span>
            )}
          </div>

          {/* APR + Capacity + Participants */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
            <div className="flex items-start gap-5 mb-5">
              <div className="w-[88px] h-[88px] rounded-full border-[3px] border-[var(--green)] flex flex-col items-center justify-center shrink-0">
                <span className="text-[22px] font-bold text-[var(--green)] leading-none">{apr}%</span>
                <span className="text-[10px] text-[var(--text-sub)] font-medium mt-0.5">APR</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">Remaining Capacity</p>
                <ProgressBar current={f.total_staked} max={f.max_stake_cap} decimals={decimals} />
              </div>
            </div>

            {/* Countdown */}
            {countdownLabel && !countdown.isZero && (
              <div className="mb-4">
                <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">{countdownLabel}</p>
                <div className="flex gap-2">
                  {[
                    { val: countdown.days, label: 'd' },
                    { val: countdown.hours, label: 'h' },
                    { val: countdown.mins, label: 'm' },
                    { val: countdown.secs, label: 's' },
                  ].map((t) => (
                    <div key={t.label} className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg w-14 h-14 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono">{pad(t.val)}</span>
                      <span className="text-[10px] text-[var(--text-sub)]">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div>
              <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">Participants</p>
              {stakeCount === 0 ? (
                <p className="text-[13px] text-[var(--text-sub)]">まだ参加者なし</p>
              ) : (
                <div className="flex items-center">
                  {Array.from({ length: Math.min(stakeCount, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-[var(--blue-light)] border-2 border-white flex items-center justify-center text-[11px] font-semibold text-[var(--blue)]"
                      style={{ marginLeft: i === 0 ? 0 : -8 }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <span className="text-xs text-[var(--text-sub)] ml-2">{stakeCount}人が参加{f.status === 'open' ? '中' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4">
            <p className="text-xs font-semibold text-[var(--text)] mb-1.5">Schedule</p>
            <p className="text-[13px] text-[var(--text-sub)] leading-relaxed">{fmtDate(f.start_at)} — {fmtDate(f.end_at)}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4">
            <p className="text-xs font-semibold text-[var(--text)] mb-1.5">Reward</p>
            <p className="text-[13px] text-[var(--text-sub)] leading-relaxed">元本 × {f.multiplier}<br />(+{apr}%報酬)</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4">
            <p className="text-xs font-semibold text-[var(--text)] mb-1.5">Join Flow</p>
            <p className="text-[13px] text-[var(--text-sub)] leading-relaxed">Connect → Stake → Earn</p>
          </div>
        </div>

        {/* Overview */}
        {f.description && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-base font-semibold mb-3">Overview</h2>
            <p className="text-[13px] text-[var(--text-sub)] leading-relaxed whitespace-pre-wrap">{f.description}</p>
          </div>
        )}

        {/* ═══ State: upcoming ═══ */}
        {f.status === 'upcoming' && !myStake && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="text-center py-6">
              <div className="text-[32px] mb-3">⏳</div>
              <p className="text-base font-semibold mb-2">開催前です</p>
              <p className="text-sm text-[var(--text-sub)]">{fmtDate(f.start_at)} から受付開始します</p>
            </div>
            <button className="w-full py-4 rounded-full text-base font-semibold bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed" disabled>
              Soon
            </button>
          </div>
        )}

        {/* ═══ State: staked (open or closed) ═══ */}
        {myStake && !isClaimable && !isClaimed && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-base font-semibold mb-5">Your Stake</h3>
            <div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">ステーク量</span>
                <span className="text-sm font-semibold font-mono">{fmtAmount(myStake.amount, decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">報酬予定</span>
                <span className="text-sm font-semibold font-mono">+{fmtAmount(Math.floor(Number(myStake.amount) * (f.multiplier - 1)), decimals)} {s}（ペイアウト後に確定）</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">受取合計（予定）</span>
                <span className="text-sm font-semibold font-mono">{fmtAmount(Math.floor(Number(myStake.amount) * f.multiplier), decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[13px] text-[var(--text-sub)]">ステータス</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef9c3] text-[#854d0e]">ロック中</span>
              </div>
            </div>
            <div className="mt-5">
              <button className="w-full py-4 rounded-full text-base font-semibold bg-transparent text-[var(--green)] border-2 border-[var(--green)] cursor-default">
                Staked ✓
              </button>
            </div>
          </div>
        )}

        {/* ═══ State: paid + claimable ═══ */}
        {isClaimable && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-base font-semibold mb-5">Your Stake</h3>
            <div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">ステーク量</span>
                <span className="text-sm font-semibold font-mono">{fmtAmount(myStake.amount, decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">報酬</span>
                <span className="text-sm font-semibold font-mono">+{fmtAmount(myStake.reward_amount - Number(myStake.amount), decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">受取合計</span>
                <span className="text-sm font-semibold font-mono">{fmtAmount(myStake.reward_amount, decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[13px] text-[var(--text-sub)]">ステータス</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--orange-light)] text-[var(--orange)]">受取可能</span>
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={() => router.push(`/staking/claim/${id}`)}
                className="w-full py-4 rounded-full text-base font-semibold bg-[var(--orange)] text-white transition-all hover:bg-[#ea6c05] hover:-translate-y-px hover:shadow-lg"
              >
                Receive 報酬を受け取る
              </button>
            </div>
          </div>
        )}

        {/* ═══ State: claimed ═══ */}
        {isClaimed && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-base font-semibold mb-5">Your Stake</h3>
            <div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">ステーク量</span>
                <span className="text-sm font-semibold font-mono">{fmtAmount(myStake.amount, decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-sub)]">報酬</span>
                <span className="text-sm font-semibold font-mono">+{fmtAmount(Number(myStake.reward_amount) - Number(myStake.amount), decimals)} {s}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[13px] text-[var(--text-sub)]">ステータス</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--green-light)] text-[var(--green)]">受取済み</span>
              </div>
            </div>
            <div className="mt-5">
              <button className="w-full py-4 rounded-full text-base font-semibold bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed" disabled>
                Claimed ✓
              </button>
            </div>
          </div>
        )}

        {/* ═══ State: open + not staked → Stake form (with period check) ═══ */}
        {!myStake && f.status === 'open' && connected && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <StakeModal
              amount={amount}
              setAmount={setAmount}
              multiplier={f.multiplier}
              decimals={decimals}
              tokenSymbol={f.token_symbol}
              minStake={f.min_stake}
              maxStake={f.max_stake}
              loading={loading}
              error={error}
              disabled={isOutOfPeriod}
              disabledMessage="応募期間外です"
              onStake={handleStake}
            />
          </div>
        )}

        {/* ═══ State: open + not connected ═══ */}
        {!myStake && f.status === 'open' && !connected && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 text-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <p className="text-sm text-[var(--text-sub)] mb-4">ウォレットを接続してステーキングに参加</p>
            <WalletMultiButton style={{
              fontSize: '14px',
              height: '44px',
              borderRadius: '9999px',
              width: '100%',
              justifyContent: 'center',
              fontFamily: 'DM Sans, sans-serif',
            }} />
          </div>
        )}

        {/* ═══ State: closed + not staked ═══ */}
        {!myStake && (f.status === 'closed' || f.status === 'paid') && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="text-center py-6">
              <div className="text-[32px] mb-3">🚫</div>
              <p className="text-base font-semibold mb-2">応募期間外です</p>
              <p className="text-sm text-[var(--text-sub)]">このプールは終了しました</p>
            </div>
            <button className="w-full py-4 rounded-full text-base font-semibold bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed" disabled>
              Ended
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

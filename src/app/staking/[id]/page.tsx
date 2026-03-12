'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
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
import { ProgressBar } from '@/components/staking/ProgressBar'
import { fetcher } from '@/lib/fetcher'
import Link from 'next/link'

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

// カウントダウン用
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

const CATEGORY_LABELS: Record<string, string> = {
  festival: 'Festival Pool',
  standard: 'Normal Pool',
  event: 'Event Pool',
}

export default function StakingDetailPage() {
  const { id } = useParams<{ id: string }>()
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

  // upcoming → start_at, open → end_at
  const countdownTarget = festival
    ? (festival.status === 'upcoming' ? festival.start_at : festival.end_at)
    : new Date().toISOString()
  const countdown = useCountdown(countdownTarget)

  if (!festival) {
    return <div className="min-h-screen flex items-center justify-center text-[#888]" style={{ background: 'var(--background)' }}>読み込み中...</div>
  }

  const f = festival
  const decimals = f.decimals || 6
  const apr = Math.round((f.multiplier - 1) * 100)
  const stakeCount = f.stake_count || 0

  async function handleStake() {
    if (!publicKey || !connected) return
    setError('')
    setLoading(true)

    try {
      const inputAmount = parseFloat(amount)
      if (isNaN(inputAmount) || inputAmount <= 0) {
        throw new Error('有効な金額を入力してください')
      }

      const rawAmount = Math.floor(inputAmount * Math.pow(10, decimals))

      if (rawAmount < Number(f.min_stake)) {
        throw new Error(`最低 ${fmtAmount(f.min_stake, decimals)} ${f.token_symbol} 必要です`)
      }
      if (rawAmount > Number(f.max_stake)) {
        throw new Error(`個人上限は ${fmtAmount(f.max_stake, decimals)} ${f.token_symbol} です`)
      }

      const remaining = Number(f.max_stake_cap) - Number(f.total_staked)
      if (rawAmount > remaining) {
        throw new Error(`残りキャップは ${fmtAmount(remaining, decimals)} ${f.token_symbol} です`)
      }

      if (!f.pool_wallet) {
        throw new Error('プールウォレットが未設定です')
      }

      const mintPubkey = new PublicKey(f.token_mint)
      const poolPubkey = new PublicKey(f.pool_wallet)

      const mintInfo = await connection.getAccountInfo(mintPubkey)
      const tokenProgramId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID

      const fromAta = getAssociatedTokenAddressSync(mintPubkey, publicKey, false, tokenProgramId)
      const toAta = getAssociatedTokenAddressSync(mintPubkey, poolPubkey, false, tokenProgramId)

      const tx = new Transaction()

      const toAtaInfo = await connection.getAccountInfo(toAta)
      if (!toAtaInfo) {
        tx.add(createAssociatedTokenAccountInstruction(
          publicKey, toAta, poolPubkey, mintPubkey, tokenProgramId
        ))
      }

      tx.add(createTransferInstruction(fromAta, toAta, publicKey, rawAmount, [], tokenProgramId))

      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')

      const res = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festival_id: id,
          wallet_address: publicKey.toBase58(),
          amount: rawAmount,
          tx_hash: sig,
        }),
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

  const showStakeForm = !myStake && f.status === 'open' && connected
  const showClaimLink = myStake && f.status === 'paid' && !myStake.claimed && myStake.reward_amount
  const countdownLabel = f.status === 'upcoming' ? 'Starts in' : f.status === 'open' ? 'Ends in' : ''
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 戻る + タイトル */}
        <Link href="/staking" className="text-sm text-[#3b82f6] hover:underline mb-2 inline-block">
          ← Staking Pools
        </Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{f.title}</h1>
          <div className="flex gap-2">
            <span className="text-sm px-3 py-1 rounded-full border border-[#e5e5e5] text-[#888]">
              {CATEGORY_LABELS[f.category] || f.category}
            </span>
            <span className="text-sm px-3 py-1 rounded-full border border-[#16a34a] text-[#16a34a] bg-[#f0fdf4]">
              {f.status === 'upcoming' ? 'Upcoming → Open' : f.status === 'open' ? 'Open' : f.status === 'closed' ? 'Closed' : 'Paid'}
            </span>
          </div>
        </div>

        {/* ヒーローエリア: 2カラム */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 左: イベント画像 */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl flex items-center justify-center min-h-[280px] overflow-hidden">
            {f.image_url ? (
              <img src={f.image_url} alt={f.title} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-[#ccc] text-lg font-bold">EVENT IMAGE</span>
            )}
          </div>

          {/* 右: APR + キャパ + カウントダウン */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-start gap-6">
              {/* APRサークル */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-[#16a34a] flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#16a34a]">{apr}%</span>
                  <span className="text-xs text-[#888]">APR</span>
                </div>
              </div>

              {/* Remaining Capacity */}
              <div className="flex-1">
                <p className="text-xs text-[#888] mb-1">Remaining Capacity</p>
                <ProgressBar
                  current={f.total_staked}
                  max={f.max_stake_cap}
                  decimals={decimals}
                  symbol={f.token_symbol}
                />
              </div>
            </div>

            {/* カウントダウン */}
            {countdownLabel && !countdown.isZero && (
              <div className="mt-4">
                <p className="text-xs text-[#888] mb-2">{countdownLabel}</p>
                <div className="flex gap-2">
                  {[
                    { val: countdown.days, label: 'd' },
                    { val: countdown.hours, label: 'h' },
                    { val: countdown.mins, label: 'm' },
                    { val: countdown.secs, label: 's' },
                  ].map((t) => (
                    <div key={t.label} className="bg-[#f5f5f7] border border-[#e5e5e5] rounded-lg w-14 h-14 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono">{pad(t.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="mt-4">
              <p className="text-xs text-[#888] mb-1">Participants</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(stakeCount, 4) }).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-[#c4d4f6]" />
                ))}
                {stakeCount > 4 && (
                  <span className="text-sm text-[#888] ml-1">+{stakeCount - 4}</span>
                )}
                {stakeCount === 0 && (
                  <span className="text-sm text-[#888]">まだ参加者なし</span>
                )}
              </div>
            </div>

            {/* Stakeボタン / ステーク済み表示 */}
            <div className="mt-4">
              {myStake ? (
                <div className="text-center">
                  <span className="inline-block bg-[#16a34a] text-white font-bold text-sm px-6 py-2.5 rounded-full">
                    Staked ✓
                  </span>
                  {showClaimLink && (
                    <Link
                      href={`/staking/claim/${id}`}
                      className="block mt-2 text-sm text-[#3b82f6] hover:underline"
                    >
                      報酬を受け取る →
                    </Link>
                  )}
                </div>
              ) : !connected ? (
                <WalletMultiButton style={{
                  fontSize: '14px',
                  height: '40px',
                  borderRadius: '9999px',
                  width: '100%',
                  justifyContent: 'center',
                }} />
              ) : f.status === 'open' ? (
                <button
                  onClick={() => document.getElementById('stake-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-[#3b82f6] text-white font-bold text-sm py-2.5 rounded-full hover:bg-[#2563eb] transition-colors"
                >
                  Stake
                </button>
              ) : (
                <span className="block text-center text-sm text-[#888]">
                  {f.status === 'upcoming' ? 'まもなく開始' : '終了済み'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3カラム情報カード */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="font-bold text-sm mb-1">Schedule</p>
            <p className="text-sm text-[#888]">{fmtDate(f.start_at)} — {fmtDate(f.end_at)}</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="font-bold text-sm mb-1">Reward</p>
            <p className="text-sm text-[#888]">Base APR 100% + {f.category === 'festival' ? 'Festival' : f.category === 'event' ? 'Event' : 'Bonus'} {apr}%</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="font-bold text-sm mb-1">Join Flow</p>
            <p className="text-sm text-[#888]">Connect → Stake → Earn</p>
          </div>
        </div>

        {/* Overview */}
        {f.description && (
          <>
            <h2 className="text-xl font-bold mb-3">Overview</h2>
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-6">
              <p className="text-sm text-[#888] leading-relaxed">{f.description}</p>
            </div>
          </>
        )}

        {/* ステーク済み詳細 */}
        {myStake && (
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-6">
            <h2 className="font-bold text-sm text-[#888] mb-3">Your Stake</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888]">ステーク量</span>
                <span className="font-mono font-bold">{fmtAmount(myStake.amount, decimals)} {f.token_symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">報酬予定</span>
                <span className="font-mono">
                  {myStake.reward_amount
                    ? `${fmtAmount(myStake.reward_amount, decimals)} ${f.token_symbol}`
                    : '― （ペイアウト待ち）'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">ステータス</span>
                <span className="font-bold">
                  {myStake.claimed ? '✓ 受取済み' : f.status === 'paid' ? '受取可能' : 'ロック中'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ステーク入力フォーム */}
        {showStakeForm && (
          <div id="stake-form" className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <h2 className="font-bold mb-3">Stake Amount</h2>
            <div className="flex items-center border border-[#e5e5e5] rounded-lg px-4 py-3 mb-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent flex-1 text-xl font-mono outline-none"
                disabled={loading}
              />
              <span className="text-[#888] text-sm ml-2">{f.token_symbol}</span>
            </div>
            <div className="text-xs text-[#888] mb-4">
              Min: {fmtAmount(f.min_stake, decimals)} / Max: {fmtAmount(f.max_stake, decimals)}
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-3">{error}</div>
            )}

            <button
              onClick={handleStake}
              disabled={loading || !amount}
              className="w-full bg-[#3b82f6] text-white font-bold text-sm py-3 rounded-full hover:bg-[#2563eb] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : 'Stake'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

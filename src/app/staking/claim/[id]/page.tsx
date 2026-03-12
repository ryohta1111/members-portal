'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Confetti } from '@/components/staking/Confetti'
import { StatusBadge } from '@/components/staking/StatusBadge'
import { fetcher } from '@/lib/fetcher'

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ClaimPage() {
  const { id: festivalId } = useParams<{ id: string }>()
  const { publicKey, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null)

  const { data: festivalData } = useSWR(`/api/staking/festival/${festivalId}`, fetcher)
  const { data: statusData, mutate } = useSWR(
    publicKey ? `/api/staking/status?festival_id=${festivalId}&wallet_address=${publicKey.toBase58()}` : null,
    fetcher
  )
  const { data: allFestivals } = useSWR('/api/staking/festivals', fetcher)

  const festival = festivalData?.festival
  const myStake = statusData?.stakes?.[0]

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-[var(--text-sub)] mb-4">ウォレットを接続してください</p>
        <WalletMultiButton />
      </div>
    )
  }

  if (!festival || !myStake) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-sub)]" style={{ background: 'var(--bg)' }}>
        読み込み中...
      </div>
    )
  }

  const decimals = festival.decimals || 6
  const rewardAmount = myStake.reward_amount || 0
  const stakeAmount = Number(myStake.amount)
  const rewardOnly = rewardAmount > stakeAmount ? rewardAmount - stakeAmount : Math.floor(stakeAmount * (festival.multiplier - 1))
  const totalAmount = stakeAmount + rewardOnly
  const isClaimed = myStake.claimed || success
  const isPending = !myStake.reward_amount || festival.status !== 'paid'

  async function handleClaim() {
    if (!publicKey || !myStake) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/staking/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festival_stake_id: myStake.id, wallet_address: publicKey.toBase58() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setClaimTxHash(data.tx_hash)
      setSuccess(true)
      mutate()
    } catch (err: any) {
      console.error('[claim]', err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const txHash = claimTxHash || myStake.claim_tx_hash
  const claimedAt = myStake.claimed_at ? new Date(myStake.claimed_at).toLocaleString('ja-JP') : null

  // Next pools for recommendation
  const otherPools = (allFestivals?.festivals || [])
    .filter((f: any) => f.id !== festivalId && (f.status === 'open' || f.status === 'upcoming'))
    .slice(0, 3)

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[900px] mx-auto px-6 py-8 relative z-10">
        {/* Back */}
        <Link href="/staking" className="inline-flex items-center gap-1.5 text-sm text-[var(--blue)] font-medium mb-5 hover:underline">
          ← Staking Pools
        </Link>

        {/* ═══ Claimed complete ═══ */}
        {isClaimed && (
          <>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-10 text-center mb-4 relative overflow-hidden">
              <Confetti />
              <span className="text-[40px] block mb-4">🎉</span>
              <div className="text-[40px] font-bold tracking-tight mb-2">
                {fmtAmount(totalAmount, decimals)} ${festival.token_symbol}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[var(--green-light)] text-[var(--green)] px-3.5 py-1.5 rounded-full text-[13px] font-bold mb-3">
                ✓ Claimed
              </div>
              <div className="text-sm text-[var(--text-sub)]">Rewards Claimed</div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-5">
                <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">Stake</p>
                <p className="text-xl font-bold font-mono">
                  {fmtAmount(stakeAmount, decimals)}
                  <span className="text-sm font-medium text-[var(--text-sub)] ml-1">${festival.token_symbol}</span>
                </p>
                <div className="mt-4">
                  <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">Reward</p>
                  <p className="text-xl font-bold font-mono text-[var(--green)]">
                    +{fmtAmount(rewardOnly, decimals)}
                    <span className="text-sm font-medium text-[var(--green)] ml-1">${festival.token_symbol}</span>
                  </p>
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-5">
                <p className="text-xs text-[var(--text-sub)] mb-2 font-medium">Transaction</p>
                {txHash ? (
                  <>
                    <p className="text-sm font-mono font-medium mb-1.5">
                      {txHash.slice(0, 6)}...{txHash.slice(-6)}
                    </p>
                    {claimedAt && <p className="text-[13px] text-[var(--text-sub)] mb-1">{claimedAt}</p>}
                    <div className="mt-3.5">
                      <a
                        href={`https://solscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[var(--blue)] text-white text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-sm)] transition-colors hover:bg-[#2563eb]"
                      >
                        View on Explorer ↗
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-sub)]">--</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ Pending ═══ */}
        {isPending && !isClaimed && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-10 text-center mb-4">
            <div className="text-[32px] mb-3">⏳</div>
            <p className="text-base font-semibold mb-2">ペイアウト処理待ち</p>
            <p className="text-sm text-[var(--text-sub)]">運営がペイアウトを実行するまでお待ちください</p>
          </div>
        )}

        {/* ═══ Claimable ═══ */}
        {!isClaimed && !isPending && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-10 text-center mb-4">
            <div className="text-[32px] mb-3">🎁</div>
            <p className="text-[32px] font-bold tracking-tight mb-2">
              {fmtAmount(totalAmount, decimals)} ${festival.token_symbol}
            </p>
            <p className="text-sm text-[var(--text-sub)] mb-8">受取可能な報酬</p>
            {error && <p className="text-sm text-[var(--red)] mb-3">{error}</p>}
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-4 rounded-full text-base font-semibold bg-[var(--orange)] text-white transition-all hover:bg-[#ea6c05] hover:-translate-y-px hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '送金処理中...' : 'Receive 報酬を受け取る'}
            </button>
            <p className="text-xs text-[var(--text-sub)] mt-3">
              クリックするとサーバーからトークンが送金されます（Phantom操作不要）
            </p>
          </div>
        )}

        {/* Next pools recommendation */}
        {otherPools.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] px-6 py-5 mb-4">
            <p className="text-sm font-semibold mb-3.5">他のプールを見る</p>
            {otherPools.map((p: any) => (
              <Link
                key={p.id}
                href={`/staking/${p.id}`}
                className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)] -mx-2 px-2 rounded transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-[var(--text-sub)] mt-0.5">
                    {p.category === 'festival' ? 'Festival Pool' : p.category === 'event' ? 'Event Pool' : 'Normal Pool'} · {fmtDate(p.start_at)} 〜 {fmtDate(p.end_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--green)]">+{Math.round((p.multiplier - 1) * 100)}%</span>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <Link
          href="/staking"
          className="block w-full text-center py-4 rounded-full text-base font-semibold bg-[var(--green)] text-white transition-all hover:bg-[#15803d] hover:-translate-y-px hover:shadow-lg"
        >
          Staking Pools を見る
        </Link>
      </div>
    </div>
  )
}

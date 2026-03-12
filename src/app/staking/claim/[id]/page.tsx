'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { fetcher } from '@/lib/fetcher'
import Link from 'next/link'

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

// 紙吹雪パーティクル
function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number; left: number; delay: number; duration: number; color: string; size: number; type: string
  }>>([])

  useEffect(() => {
    const colors = ['#16a34a', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#f97316']
    const types = ['square', 'circle', 'ribbon']
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      type: types[Math.floor(Math.random() * types.length)],
    }))
    setParticles(p)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div
            style={{
              width: p.type === 'ribbon' ? p.size * 0.4 : p.size,
              height: p.type === 'ribbon' ? p.size * 2 : p.size,
              background: p.color,
              borderRadius: p.type === 'circle' ? '50%' : p.type === 'ribbon' ? '2px' : '1px',
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  )
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

  const festival = festivalData?.festival
  const myStake = statusData?.stakes?.[0]

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-[#888] mb-4">ウォレットを接続してください</p>
        <WalletMultiButton />
      </div>
    )
  }

  if (!festival || !myStake) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#888]" style={{ background: 'var(--background)' }}>
        読み込み中...
      </div>
    )
  }

  const decimals = festival.decimals || 6
  const rewardAmount = myStake.reward_amount || 0
  const totalAmount = Number(myStake.amount) + rewardAmount
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
        body: JSON.stringify({
          festival_stake_id: myStake.id,
          wallet_address: publicKey.toBase58(),
        }),
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

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }}>
      {/* 紙吹雪 */}
      {isClaimed && <Confetti />}

      <div className="max-w-xl mx-auto px-4 py-8 relative z-10">
        <Link href="/staking" className="text-sm text-[#3b82f6] hover:underline mb-6 inline-block">
          ← Staking Pools
        </Link>

        {/* メインカード: Claimed表示 */}
        {isClaimed && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center mb-4 shadow-sm">
            <div className="text-4xl mb-2">🎉</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl font-bold">
                {fmtAmount(totalAmount, decimals)} {festival.token_symbol}
              </span>
              <span className="bg-[#dcfce7] text-[#16a34a] text-sm font-bold px-3 py-1 rounded-full">
                Claimed
              </span>
            </div>
            <p className="text-[#888]">Rewards Claimed</p>
          </div>
        )}

        {/* ペイアウト待ち */}
        {isPending && !isClaimed && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center mb-4">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-lg font-bold mb-1">ペイアウト処理待ち</p>
            <p className="text-sm text-[#888]">運営がペイアウトを実行するまでお待ちください</p>
          </div>
        )}

        {/* Claim可能 */}
        {!isClaimed && !isPending && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center mb-4">
            <div className="text-4xl mb-2">🎁</div>
            <p className="text-3xl font-bold mb-1">
              {fmtAmount(totalAmount, decimals)} {festival.token_symbol}
            </p>
            <p className="text-[#888] mb-6">受取可能な報酬</p>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-[#16a34a] text-white font-bold text-base py-3 rounded-full hover:bg-[#15803d] transition-colors disabled:opacity-40"
            >
              {loading ? '送金処理中...' : '報酬を受け取る'}
            </button>
            <p className="text-xs text-[#888] mt-2">
              クリックするとサーバーからトークンが送金されます（Phantom操作不要）
            </p>
          </div>
        )}

        {/* 詳細カード: 2カラム */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-xs text-[#888] mb-1">Stake</p>
            <p className="text-xl font-bold font-mono">{fmtAmount(myStake.amount, decimals)} {festival.token_symbol}</p>
            <p className="text-xs text-[#888] mt-3 mb-1">Reward</p>
            <p className="text-xl font-bold font-mono">
              {rewardAmount > 0 ? `${fmtAmount(rewardAmount, decimals)} ${festival.token_symbol}` : '―'}
            </p>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-xs text-[#888] mb-1">Transaction</p>
            {txHash ? (
              <>
                <p className="text-sm font-mono mt-1">
                  Tx: {txHash.slice(0, 6)}...{txHash.slice(-6)}
                </p>
                {claimedAt && (
                  <p className="text-sm text-[#888] mt-1">Date: {claimedAt}</p>
                )}
                <a
                  href={`https://solscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#3b82f6] text-white text-sm font-bold px-5 py-2 rounded-lg mt-3 hover:bg-[#2563eb] transition-colors"
                >
                  View on Explorer
                </a>
              </>
            ) : (
              <p className="text-sm text-[#888] mt-1">未実行</p>
            )}
          </div>
        </div>

        {/* Stake Again */}
        <Link
          href="/staking"
          className="block text-center bg-[#16a34a] text-white font-bold text-base py-3 rounded-full hover:bg-[#15803d] transition-colors"
        >
          Stake Again
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { fetcher } from '@/lib/fetcher'
import Link from 'next/link'

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

export default function ClaimPage() {
  const { id: festivalId } = useParams<{ id: string }>()
  const { publicKey, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: festivalData } = useSWR(`/api/staking/festival/${festivalId}`, fetcher)
  const { data: statusData, mutate } = useSWR(
    publicKey ? `/api/staking/status?festival_id=${festivalId}&wallet_address=${publicKey.toBase58()}` : null,
    fetcher
  )

  const festival = festivalData?.festival
  const myStake = statusData?.stakes?.[0]

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <p className="text-[#888] mb-4">ウォレットを接続してください</p>
        <WalletMultiButton />
      </div>
    )
  }

  if (!festival || !myStake) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#888]">
        読み込み中...
      </div>
    )
  }

  const decimals = festival.decimals || 6
  const rewardAmount = myStake.reward_amount || 0
  const totalAmount = Number(myStake.amount) + rewardAmount

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

      setSuccess(true)
      mutate()
    } catch (err: any) {
      console.error('[claim]', err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const canClaim = !myStake.claimed && myStake.reward_amount && festival.status === 'paid'
  const isPending = !myStake.reward_amount || festival.status !== 'paid'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/staking" className="text-sm text-[#888] hover:text-white mb-4 inline-block">
          ← 一覧に戻る
        </Link>

        <h1 className="text-2xl font-bold mb-1">報酬の受取</h1>
        <p className="text-[#888] text-sm mb-6">{festival.title}</p>

        {/* 金額サマリ */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4 space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">ステーク量</span>
            <span className="font-mono">{fmtAmount(myStake.amount, decimals)} {festival.token_symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">報酬</span>
            <span className="font-mono">
              {rewardAmount > 0
                ? `${fmtAmount(rewardAmount, decimals)} ${festival.token_symbol}`
                : '―'}
            </span>
          </div>
          <hr className="border-[#222]" />
          <div className="flex justify-between text-sm font-bold">
            <span>受取合計</span>
            <span className="font-mono">
              {rewardAmount > 0
                ? `${fmtAmount(totalAmount, decimals)} ${festival.token_symbol}`
                : '―'}
            </span>
          </div>
        </div>

        {/* claim可能 */}
        {canClaim && !success && (
          <div>
            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-white text-black font-bold text-sm py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              {loading ? '送金処理中...' : '報酬を受け取る'}
            </button>
            <p className="text-xs text-[#888] mt-2 text-center">
              クリックするとサーバーからトークンが送金されます（Phantom操作不要）
            </p>
          </div>
        )}

        {/* claim済み or 成功直後 */}
        {(myStake.claimed || success) && (
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 text-center">
            <p className="text-green-400 font-bold mb-2">✓ 受取済み</p>
            {myStake.claimed_at && (
              <p className="text-xs text-[#888]">
                {new Date(myStake.claimed_at).toLocaleString('ja-JP')}
              </p>
            )}
            {myStake.claim_tx_hash && (
              <a
                href={`https://solscan.io/tx/${myStake.claim_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-1 inline-block"
              >
                TX: {myStake.claim_tx_hash.slice(0, 8)}...{myStake.claim_tx_hash.slice(-8)}
              </a>
            )}
          </div>
        )}

        {/* ペイアウト待ち */}
        {isPending && !myStake.claimed && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <p className="text-yellow-400 mb-1">⏳ ペイアウト処理待ち</p>
            <p className="text-xs text-[#888]">
              運営がペイアウトを実行するまでお待ちください
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

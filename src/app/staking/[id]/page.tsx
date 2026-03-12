'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { StatusBadge } from '@/components/staking/StatusBadge'
import { CategoryBadge } from '@/components/staking/CategoryBadge'
import { ProgressBar } from '@/components/staking/ProgressBar'
import { fetcher } from '@/lib/fetcher'
import Link from 'next/link'

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
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
  const myStake = statusData?.stakes?.[0] // 1祭り1ウォレットなので最初の1件

  if (!festival) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#888]">読み込み中...</div>
  }

  const f = festival
  const decimals = f.decimals || 6

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

      // min/max チェック
      if (rawAmount < Number(f.min_stake)) {
        throw new Error(`最低 ${fmtAmount(f.min_stake, decimals)} ${f.token_symbol} 必要です`)
      }
      if (rawAmount > Number(f.max_stake)) {
        throw new Error(`個人上限は ${fmtAmount(f.max_stake, decimals)} ${f.token_symbol} です`)
      }

      // 残キャップチェック
      const remaining = Number(f.max_stake_cap) - Number(f.total_staked)
      if (rawAmount > remaining) {
        throw new Error(`残りキャップは ${fmtAmount(remaining, decimals)} ${f.token_symbol} です`)
      }

      if (!f.pool_wallet) {
        throw new Error('プールウォレットが未設定です')
      }

      // Token-2022対応送金
      const mintPubkey = new PublicKey(f.token_mint)
      const poolPubkey = new PublicKey(f.pool_wallet)

      // mintのownerでProgram判定
      const mintInfo = await connection.getAccountInfo(mintPubkey)
      const tokenProgramId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID

      const fromAta = getAssociatedTokenAddressSync(mintPubkey, publicKey, false, tokenProgramId)
      const toAta = getAssociatedTokenAddressSync(mintPubkey, poolPubkey, false, tokenProgramId)

      const tx = new Transaction()

      // 送金先ATAがなければ作成
      const toAtaInfo = await connection.getAccountInfo(toAta)
      if (!toAtaInfo) {
        tx.add(createAssociatedTokenAccountInstruction(
          publicKey, toAta, poolPubkey, mintPubkey, tokenProgramId
        ))
      }

      tx.add(createTransferInstruction(fromAta, toAta, publicKey, rawAmount, [], tokenProgramId))

      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')

      // API登録
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

      // 成功 → 再取得
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <Link href="/staking" className="text-sm text-[#888] hover:text-white mb-4 inline-block">
          ← 一覧に戻る
        </Link>

        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={f.category} />
          <StatusBadge status={f.status} />
        </div>
        <h1 className="text-2xl font-bold mt-2">{f.title}</h1>
        <p className="text-[#888] text-sm mb-6">{f.token_symbol}</p>

        {/* 詳細 */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#888]">期間</span>
            <span>{fmtDate(f.start_at)} 〜 {fmtDate(f.end_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">倍率</span>
            <span className="font-mono">×{f.multiplier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">個人上限</span>
            <span className="font-mono">{fmtAmount(f.max_stake, decimals)} {f.token_symbol}</span>
          </div>
        </div>

        {/* キャップ消費率 */}
        <div className="mb-6">
          <ProgressBar
            current={f.total_staked}
            max={f.max_stake_cap}
            decimals={decimals}
            symbol={f.token_symbol}
          />
        </div>

        <hr className="border-[#222] mb-6" />

        {/* ステーク済みの場合 */}
        {myStake && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 space-y-3">
            <h2 className="font-bold text-sm text-[#888]">あなたのステーク</h2>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">ステーク量</span>
              <span className="font-mono">{fmtAmount(myStake.amount, decimals)} {f.token_symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">報酬予定</span>
              <span className="font-mono">
                {myStake.reward_amount
                  ? `${fmtAmount(myStake.reward_amount, decimals)} ${f.token_symbol}`
                  : '― （ペイアウト待ち）'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">ステータス</span>
              <span>
                {myStake.claimed ? '✓ 受取済み' : f.status === 'paid' ? '受取可能' : 'ロック中'}
              </span>
            </div>
            {showClaimLink && (
              <Link
                href={`/staking/claim/${id}`}
                className="block text-center bg-white text-black font-bold text-sm py-2 rounded hover:bg-gray-200 transition-colors mt-2"
              >
                報酬を受け取る →
              </Link>
            )}
          </div>
        )}

        {/* ウォレット未接続 */}
        {!connected && (
          <div className="text-center py-8">
            <p className="text-[#888] text-sm mb-4">ステーキングにはウォレット接続が必要です</p>
            <WalletMultiButton style={{ fontSize: '14px' }} />
          </div>
        )}

        {/* ステーク入力フォーム */}
        {showStakeForm && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-4">
            <h2 className="font-bold text-sm text-[#888] mb-3">ステーク量を入力</h2>
            <div className="flex items-center bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 mb-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent flex-1 text-lg font-mono outline-none"
                disabled={loading}
              />
              <span className="text-[#888] text-sm ml-2">{f.token_symbol}</span>
            </div>
            <div className="text-xs text-[#888] mb-4">
              最低: {fmtAmount(f.min_stake, decimals)} / 最大: {fmtAmount(f.max_stake, decimals)}
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-3">{error}</div>
            )}

            <button
              onClick={handleStake}
              disabled={loading || !amount}
              className="w-full bg-white text-black font-bold text-sm py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : 'ステークする'}
            </button>
          </div>
        )}

        {/* 開催中じゃない & 未ステーク & 接続済み */}
        {connected && !myStake && f.status !== 'open' && (
          <div className="text-center text-[#888] text-sm py-8">
            {f.status === 'upcoming' ? 'まもなく開始します' : 'この祭りは終了しました'}
          </div>
        )}
      </div>
    </div>
  )
}

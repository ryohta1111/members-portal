'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Link from 'next/link'
import { Header } from '@/components/portal/Header'
import './vote.css'

const HELIUS_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || ''
const SB_URL = 'https://mazeypdufgldzoxhdiio.supabase.co'
const SB_KEY = 'sb_publishable_M5r4eM8ry3jhMWVv_ynpjA_9QeVauhS'
const TABLE_NAME = 'votes_vol5'

interface GateToken {
  mint: string
  ticker: string
  name: string
  minHolding: number
  voteRatio: number
  isTarget: boolean
}

type Step = 'loading' | 'connect' | 'checking' | 'denied' | 'form' | 'confirm' | 'sending' | 'complete' | 'already'

// 名言カード
const QUOTE_CARDS: Record<string, { text: string; by: string }[]> = {
  COMMON: [
    { text: '押忍！今日も一日、魂込めていこうぜ。', by: 'TH' },
    { text: 'コインは買うものじゃない。信じるものだ。', by: 'KK' },
    { text: '小さく始めて、でかく夢見ろ。', by: 'TH' },
    { text: '迷ったら動け。後悔は後でしろ。', by: 'KK' },
  ],
  RARE: [
    { text: '信じる者だけが、最後に笑う。', by: 'KK' },
    { text: 'ホルダーは家族だ。売るな、守れ。', by: 'TH' },
    { text: '一票に、魂を込めろ。', by: 'TH' },
  ],
  EPIC: [
    { text: '数字じゃない。想いの重さが票数だ。', by: 'KK' },
    { text: '花火点火5秒前！', by: 'KK' },
  ],
  LEGENDARY: [
    { text: 'できるできないじゃない。やるかやらないかだ。', by: 'KK' },
  ],
}

function getRarity(v: number) {
  if (v >= 15000000) return 'LEGENDARY'
  if (v >= 5000000) return 'EPIC'
  if (v >= 1000000) return 'RARE'
  return 'COMMON'
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#aaa', RARE: '#14f195', EPIC: '#a75dff', LEGENDARY: '#ffc832',
}

async function fetchBal(wallet: string, mint: string): Promise<number> {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getTokenAccountsByOwner',
      params: [wallet, { mint }, { encoding: 'jsonParsed' }],
    }),
  })
  const json = await res.json()
  const accs = json.result?.value || []
  return accs.reduce((tot: number, a: any) =>
    tot + parseFloat(a.account?.data?.parsed?.info?.tokenAmount?.uiAmountString || '0'), 0)
}

export default function VotePage() {
  const { publicKey, connected } = useWallet()
  const [step, setStep] = useState<Step>('loading')
  const [gateList, setGateList] = useState<GateToken[]>([])
  const [voteTargets, setVoteTargets] = useState<GateToken[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [qualifyLabel, setQualifyLabel] = useState('')
  const [balanceText, setBalanceText] = useState('')
  const [votes, setVotes] = useState<Record<number, number>>({})
  const [accountName, setAccountName] = useState('')
  const [accountError, setAccountError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingCount, setSendingCount] = useState(0)
  const [quoteCard, setQuoteCard] = useState<{ text: string; by: string; rarity: string } | null>(null)
  const [receiptTime, setReceiptTime] = useState('')

  const walletAddr = publicKey?.toString() || ''
  const shortAddr = walletAddr ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : ''

  const used = Object.values(votes).reduce((s, v) => s + v, 0)
  const remaining = totalVotes - used

  // トークン設定をAPIから読み込み
  useEffect(() => {
    fetch('/api/vote-tokens')
      .then(r => r.json())
      .then((data: any[]) => {
        const tokens: GateToken[] = data.map(t => ({
          mint: t.mint,
          ticker: t.ticker,
          name: t.name,
          minHolding: t.min_holding ?? t.minHolding ?? 1,
          voteRatio: t.vote_ratio ?? t.voteRatio ?? 1,
          isTarget: t.is_target ?? t.isTarget ?? true,
        }))
        setGateList(tokens.filter(t => t.mint))
        setVoteTargets(tokens.filter(t => t.isTarget))
        setStep('connect')
      })
      .catch(() => setStep('connect'))
  }, [])

  const checkBalance = useCallback(async (addr: string) => {
    if (gateList.length === 0) return
    setStep('checking')
    try {
      const results = await Promise.allSettled(gateList.map(t => fetchBal(addr, t.mint)))
      const bals = results.map(r => r.status === 'fulfilled' ? r.value : 0)
      const okTokens = gateList.filter((_, i) => bals[i] >= gateList[i].minHolding)

      if (okTokens.length === 0) { setStep('denied'); return }

      let total = 0
      gateList.forEach((t, i) => {
        if (bals[i] >= t.minHolding) total += Math.floor(bals[i] * t.voteRatio)
      })

      setTotalVotes(total)
      setQualifyLabel(okTokens.map(t => t.ticker).join(' / '))
      setBalanceText(okTokens.map((t) => {
        const i = gateList.indexOf(t)
        return `${Math.floor(bals[i]).toLocaleString()} ${t.ticker}`
      }).join(' / '))

      // 重複チェック
      const dupRes = await fetch(`${SB_URL}/rest/v1/${TABLE_NAME}?wallet_address=eq.${encodeURIComponent(addr)}&select=id`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      })
      const dupData = await dupRes.json()
      if (dupData?.length > 0) { setStep('already'); return }

      // 初期化
      const initVotes: Record<number, number> = {}
      voteTargets.forEach((_, i) => { initVotes[i] = 0 })
      setVotes(initVotes)
      setStep('form')
    } catch {
      setStep('denied')
    }
  }, [gateList, voteTargets])

  useEffect(() => {
    if (gateList.length === 0) return
    if (connected && publicKey) {
      checkBalance(publicKey.toString())
    } else {
      setStep('connect')
    }
  }, [connected, publicKey, checkBalance, gateList])

  function updateVote(idx: number, val: number) {
    const otherUsed = Object.entries(votes).reduce((s, [k, v]) => parseInt(k) !== idx ? s + v : s, 0)
    const max = totalVotes - otherUsed
    const clamped = Math.max(0, Math.min(val, max))
    setVotes(prev => ({ ...prev, [idx]: clamped }))
  }

  function handleSubmit() {
    if (!accountName.trim()) {
      setAccountError(true)
      setTimeout(() => setAccountError(false), 2000)
      return
    }
    setStep('confirm')
  }

  async function handleSend() {
    setSending(true)
    const votesJson: Record<string, number> = {}
    voteTargets.forEach((c, i) => {
      if ((votes[i] || 0) > 0) votesJson[c.ticker] = votes[i]
    })

    const payload = {
      wallet_address: walletAddr,
      account_name: accountName.trim(),
      qualify: qualifyLabel,
      total_votes: totalVotes,
      votes: votesJson,
    }

    try {
      const res = await fetch(`${SB_URL}/rest/v1/${TABLE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      })

      if (res.status === 409) {
        alert('このウォレットはすでに投票済みです。')
        setSending(false)
        return
      }
      if (!res.ok) throw new Error('送信失敗')

      const now = new Date()
      setReceiptTime(`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} JST`)

      // 送信アニメーション
      setStep('sending')
      const total = used
      const dur = 1800
      const start = performance.now()
      function animate(ts: number) {
        const prog = Math.min((ts - start) / dur, 1)
        const eased = 1 - Math.pow(1 - prog, 3)
        setSendingCount(Math.floor(eased * total))
        if (prog < 1) requestAnimationFrame(animate)
        else {
          setSendingCount(total)
          // 名言カード
          const rarity = getRarity(total)
          const pool = QUOTE_CARDS[rarity]
          const q = pool[Math.floor(Math.random() * pool.length)]
          setTimeout(() => {
            setQuoteCard({ ...q, rarity })
            setTimeout(() => {
              setQuoteCard(null)
              setStep('complete')
            }, 5000)
          }, 1200)
        }
      }
      requestAnimationFrame(animate)
    } catch {
      alert('送信に失敗しました。再度お試しください。')
      setSending(false)
    }
  }

  // ─── LOADING ───
  if (step === 'loading') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <div className="v-spinner" />
          <p className="v-gate-desc">設定を読み込み中...</p>
        </div>
      </div>
    )
  }

  // ─── CONNECT ───
  if (step === 'connect') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <div style={{ fontSize: 48 }}>🗳️</div>
          <h1 className="v-gate-title">COMMUNITY VOTE</h1>
          <p className="v-gate-desc">ウォレットを接続して投票に参加しよう</p>
          <WalletMultiButton className="v-connect-btn" />
        </div>
      </div>
    )
  }

  // ─── CHECKING ───
  if (step === 'checking') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <div className="v-spinner" />
          <p className="v-gate-desc">トークン残高を確認中...</p>
        </div>
      </div>
    )
  }

  // ─── DENIED ───
  if (step === 'denied') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <div style={{ fontSize: 48 }}>🔒</div>
          <h2 className="v-gate-title">アクセス不可</h2>
          <p className="v-gate-desc">対象トークンを保有していません。</p>
          <button className="v-btn-ghost" onClick={() => checkBalance(walletAddr)}>再確認する</button>
        </div>
      </div>
    )
  }

  // ─── ALREADY VOTED ───
  if (step === 'already') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 className="v-gate-title">投票済みです</h2>
          <p className="v-gate-desc">このウォレットはすでに投票が完了しています。<br />ご参加ありがとうございました！押忍！</p>
          <Link href="/" className="v-btn">ポータルに戻る</Link>
        </div>
      </div>
    )
  }

  // ─── SENDING ───
  if (step === 'sending') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-gate">
          <p className="v-sending-label">投票を送信中...</p>
          <div className="v-sending-count">{sendingCount.toLocaleString()}</div>
          <span className="v-sending-unit">票</span>
          {quoteCard && (
            <div className="v-quote" onClick={() => { setQuoteCard(null); setStep('complete') }}>
              <div className="v-quote-rarity" style={{ color: RARITY_COLORS[quoteCard.rarity] }}>
                {quoteCard.rarity}
              </div>
              <p className="v-quote-text">"{quoteCard.text}"</p>
              <span className="v-quote-by">— by {quoteCard.by}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── COMPLETE ───
  if (step === 'complete') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-receipt">
          <div className="v-receipt-thanks">
            <div style={{ fontSize: 32 }}>🎉</div>
            <h2>投票完了</h2>
            <p>ご参加ありがとうございました！</p>
          </div>
          <div className="v-receipt-card">
            <div className="v-receipt-row"><span>Account</span><span>{accountName}</span></div>
            <div className="v-receipt-row"><span>Wallet</span><span className="mono">{shortAddr}</span></div>
            <div className="v-receipt-row"><span>Qualify</span><span>{qualifyLabel}</span></div>
            <div className="v-receipt-row"><span>Total</span><span>{totalVotes.toLocaleString()} 票</span></div>
            <div className="v-receipt-row"><span>Time</span><span>{receiptTime}</span></div>
            <div className="v-receipt-divider" />
            {voteTargets.map((c, i) => {
              const v = votes[i] || 0
              if (v <= 0) return null
              return (
                <div key={i} className="v-receipt-vote">
                  <span className="v-receipt-ticker">{c.ticker}</span>
                  <span className="v-receipt-name">{c.name}</span>
                  <span className="v-receipt-count">{v.toLocaleString()} 票</span>
                </div>
              )
            })}
          </div>
          <Link href="/" className="v-btn" style={{ width: '100%', textAlign: 'center' }}>ポータルに戻る</Link>
        </div>
      </div>
    )
  }

  // ─── CONFIRM ───
  if (step === 'confirm') {
    return (
      <div className="v-page">
        <Header />
        <div className="v-steps"><div className="v-step done">1</div><div className="v-step-line done" /><div className="v-step active">2</div><div className="v-step-line" /><div className="v-step">3</div></div>
        <div className="v-confirm">
          <h2 className="v-confirm-title">投票内容の確認</h2>
          <p className="v-confirm-desc">以下の内容で送信します。</p>
          <div className="v-confirm-field"><span>Wallet</span><span className="mono">{shortAddr}</span></div>
          <div className="v-confirm-field"><span>Account</span><span>{accountName}</span></div>
          <div className="v-confirm-field"><span>保有票数</span><span>{totalVotes.toLocaleString()} 票</span></div>
          <div className="v-confirm-field"><span>Qualify</span><span>{qualifyLabel}</span></div>
          <div className="v-confirm-votes">
            {voteTargets.map((c, i) => {
              const v = votes[i] || 0
              if (v <= 0) return null
              return (
                <div key={i} className="v-confirm-vote-row">
                  <span className="v-confirm-ticker">{c.ticker}</span>
                  <span className="v-confirm-name">{c.name}</span>
                  <span className="v-confirm-count">{v.toLocaleString()} 票</span>
                </div>
              )
            })}
          </div>
          <button className="v-btn" onClick={handleSend} disabled={sending}>
            {sending ? '送信中...' : '送信する'}
          </button>
          <button className="v-btn-ghost" onClick={() => setStep('form')}>戻る</button>
        </div>
      </div>
    )
  }

  // ─── FORM ───
  return (
    <div className="v-page">
      <div className="v-hdr">
        <Link href="/" className="v-logo">035HP</Link>
        <WalletMultiButton />
      </div>
      <div className="v-steps"><div className="v-step active">1</div><div className="v-step-line" /><div className="v-step">2</div><div className="v-step-line" /><div className="v-step">3</div></div>

      <div className="v-title-area">
        <div className="v-verified">VERIFIED HOLDER</div>
        <h1 className="v-title">COMMUNITY<br />VOTE</h1>
        <p className="v-title-desc">保有トークンの枚数に応じて投票できます。<br />投票は1ウォレット1回のみです。</p>
      </div>

      <div className="v-summary">
        <div className="v-summary-item">
          <div className="v-summary-label">REMAINING</div>
          <div className={`v-summary-val ${remaining === 0 ? 'zero' : ''} ${remaining < 0 ? 'over' : ''}`}>
            {remaining.toLocaleString()}
          </div>
        </div>
        <span className="v-summary-sep">/</span>
        <div className="v-summary-item">
          <div className="v-summary-label">TOTAL</div>
          <div className="v-summary-val">{totalVotes.toLocaleString()}</div>
        </div>
      </div>

      <div className="v-form">
        <div className="v-identity">
          <div className="v-id-label">WALLET</div>
          <div className="v-id-addr">{shortAddr}</div>
          <div className="v-id-bal">{balanceText}</div>
          <div className="v-id-qualify">{qualifyLabel}</div>
        </div>

        <div className="v-field">
          <label className="v-field-label">
            アカウント名 <span className="v-required">必須</span>
          </label>
          <input
            className={`v-input ${accountError ? 'error' : ''}`}
            placeholder="表示名を入力"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
          />
        </div>

        <div className="v-field">
          <label className="v-field-label">投票先</label>
          <div className="v-vote-list">
            {voteTargets.map((c, i) => (
              <div key={i} className="v-vote-row">
                <div className="v-vote-info">
                  <span className="v-vote-ticker">{c.ticker}</span>
                  <span className="v-vote-name">{c.name}</span>
                </div>
                <div className="v-vote-controls">
                  <input
                    type="number"
                    className="v-vote-input"
                    min={0}
                    value={votes[i] || 0}
                    onChange={e => updateVote(i, parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="range"
                    className="v-vote-slider"
                    min={0}
                    max={totalVotes}
                    value={votes[i] || 0}
                    onChange={e => updateVote(i, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="v-btn" disabled={remaining < 0 || used === 0} onClick={handleSubmit}>
          確認する →
        </button>
        <p className="v-security">この投票にトークンの送金は発生しません。安心してご参加ください。</p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface Props {
  walletAddress: string
  onDone: (username: string) => void
  onSkip: () => void
}

export function UsernameModal({ walletAddress, onDone, onSkip }: Props) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    const clean = username.replace(/^@/, '').trim()
    if (!clean) { setError('\u30E6\u30FC\u30B6\u30FC\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/radar/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress, x_username: clean }),
    })
    if (res.ok) { onDone(clean) } else {
      const data = await res.json()
      setError(data.error || '\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">CT Radarにようこそ</div>
        <div className="modal-desc">
          あなたのXアカウントを登録してください。コミュニティ内でのあなたの影響が可視化されます。
        </div>
        <div className="modal-input-wrap">
          <span className="modal-at">@</span>
          <input
            className="modal-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="\u30E6\u30FC\u30B6\u30FC\u540D\u3092\u5165\u529B"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{error}</div>}
        <div className="modal-buttons">
          <button className="radar-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '\u767B\u9332\u4E2D...' : '\u767B\u9332\u3059\u308B'}
          </button>
          <button className="radar-btn-secondary" onClick={onSkip}>あとで</button>
        </div>
        <div className="modal-note">※プロフィール設定で後から変更可能</div>
      </div>
    </div>
  )
}

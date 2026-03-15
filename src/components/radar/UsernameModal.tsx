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
    if (!clean) { setError('ユーザー名を入力してください'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/radar/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress, x_username: clean }),
    })
    if (res.ok) {
      onDone(clean)
    } else {
      const data = await res.json()
      setError(data.error || '登録に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="radar-modal-overlay">
      <div className="radar-modal">
        <h2>CT Radarにようこそ</h2>
        <p>あなたのXアカウントを登録してください。コミュニティ内でのあなたの影響が可視化されます。</p>
        <input
          className="radar-modal-input"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="@ユーザー名を入力"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div className="radar-modal-btns">
          <button className="radar-modal-btn primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '登録中...' : '登録する'}
          </button>
          <button className="radar-modal-btn ghost" onClick={onSkip}>あとで</button>
        </div>
        <div className="radar-modal-note">※プロフィール設定で後から変更可能</div>
      </div>
    </div>
  )
}

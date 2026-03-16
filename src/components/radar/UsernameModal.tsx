'use client'

import { useState } from 'react'

interface Props {
  walletAddress: string
  onDone: (username: string) => void
  onSkip: () => void
}

export function UsernameModal({ walletAddress, onDone, onSkip }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleXLogin() {
    setLoading(true)
    setError('')
    try {
      // Get auth URL and code verifier
      const res = await fetch(`/api/radar/auth?wallet=${walletAddress}`)
      const data = await res.json()

      if (!data.authUrl) {
        setError('認証URLの取得に失敗しました')
        setLoading(false)
        return
      }

      // Store code_verifier and wallet in sessionStorage
      sessionStorage.setItem('x_oauth_code_verifier', data.codeVerifier)
      sessionStorage.setItem('x_oauth_wallet', walletAddress)

      // Redirect to X authorization page
      window.location.href = data.authUrl
    } catch {
      setError('エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="r-modal-overlay">
      <div className="r-modal">
        <div className="r-modal-title">CT Radarにようこそ</div>
        <div className="r-modal-desc">
          Xアカウントでログインしてください。コミュニティ内でのあなたの影響が可視化されます。
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 12 }}>{error}</div>}
        <div className="r-modal-buttons">
          <button className="radar-btn-primary" onClick={handleXLogin} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>𝕏</span>
            {loading ? '接続中...' : 'Xでログイン'}
          </button>
          <button className="radar-btn-secondary" onClick={onSkip}>あとで</button>
        </div>
        <div className="r-modal-note">※Xの認証ページに移動します。投稿権限は要求しません。</div>
      </div>
    </div>
  )
}

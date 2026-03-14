'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(redirect)
      router.refresh()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: 16,
        padding: '48px 40px',
        width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#1C1B18' }}>
          035HP Members
        </div>
        <p style={{ fontSize: 13, color: '#807D76', marginTop: -8 }}>
          パスワードを入力してください
        </p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%',
            padding: '12px 14px',
            border: `1px solid ${error ? '#DC2626' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ fontSize: 12, color: '#DC2626', marginTop: -12 }}>
            パスワードが正しくありません
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            background: '#1C1B18',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading || !password ? 0.4 : 1,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? '確認中...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

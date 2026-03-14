'use client'

import Link from 'next/link'

export default function VotePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        padding: 48,
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        maxWidth: 420,
        width: '100%',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Vote</h1>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: '0 0 28px', lineHeight: 1.6 }}>
          コミュニティ投票機能は現在開発中です。<br />もうしばらくお待ちください。
        </p>
        <Link href="/" style={{
          display: 'inline-block', padding: '10px 24px',
          background: '#111', color: '#fff', borderRadius: 8,
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          ← ポータルに戻る
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'

interface RankEntry {
  rank: number; x_id?: string; username: string; display_name: string
  profile_image_url: string | null; score: number
  followers_count?: number; period_posts?: number
  follower_score?: number; post_score?: number; like_score?: number
  rt_score?: number; reply_score?: number; intl_bonus?: number
  period_likes?: number; period_retweets?: number
}

const INITIAL_COUNT = 10

function ScoreBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="r-sbar-row">
      <span className="r-sbar-label">{label}</span>
      <div className="r-sbar-bg">
        <div className="r-sbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="r-sbar-val">+{value}</span>
    </div>
  )
}

function ScoreTooltip({ entry }: { entry: RankEntry }) {
  const bars = [
    { label: 'フォロワー', value: entry.follower_score || 0 },
    { label: '投稿', value: entry.post_score || 0 },
    { label: 'いいね', value: entry.like_score || 0 },
    { label: 'RT', value: entry.rt_score || 0 },
    { label: 'リプライ', value: entry.reply_score || 0 },
    { label: '国際', value: entry.intl_bonus || 0 },
  ]
  const max = Math.max(...bars.map(b => b.value), 1)

  return (
    <div style={{
      position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 20,
      background: '#222119', border: '0.5px solid rgba(200,75,47,0.3)',
      borderRadius: 8, padding: '12px 14px', minWidth: 220,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(200,75,47,0.6)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        スコア内訳 — {entry.display_name || entry.username}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', width: 50, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(b.value / max) * 100}%`, background: '#C84B2F', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', width: 28, textAlign: 'right', fontFamily: "'DM Mono', monospace" }}>+{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RankingTable({ data, myUsername, eventTitle, onRowHover }: { data: RankEntry[]; myUsername: string | null; eventTitle: string; onRowHover?: (xId: string | null) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hoveredRank, setHoveredRank] = useState<number | null>(null)
  const [expandedRank, setExpandedRank] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const list = expanded ? data : data.slice(0, INITIAL_COUNT)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="r-panel" ref={ref}>
      <div className="r-panel-header">
        <span className="r-panel-title">影響ランキング</span>
        <span className="r-panel-sub">{eventTitle} 期間中</span>
      </div>
      <div className="r-ranking-list">
        {list.map((r, i) => {
          const isMe = myUsername && r.username.toLowerCase() === myUsername.toLowerCase()
          const initials = r.username.slice(0, 2).toUpperCase()
          return (
            <div key={r.rank}
              id={r.x_id ? `rank-${r.x_id}` : undefined}
              className={`r-rank-row ${isMe ? 'r-me' : ''} ${visible ? 'r-visible' : ''}`}
              style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms', position: 'relative', cursor: 'pointer' }}
              onClick={() => setExpandedRank(expandedRank === r.rank ? null : r.rank)}
              onMouseEnter={() => { setHoveredRank(r.rank); onRowHover?.(r.x_id || null) }}
              onMouseLeave={() => { setHoveredRank(null); onRowHover?.(null) }}
            >
              <span className={`r-rank-num ${isMe ? 'r-me' : ''}`}>{r.rank}</span>
              <div className={`r-rank-avatar ${isMe ? 'r-me' : ''}`}>
                {r.profile_image_url
                  ? <img src={r.profile_image_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                  : initials
                }
              </div>
              <span className="r-rank-name">
                {r.display_name || r.username}
                {isMe && <span className="r-you-badge">YOU</span>}
              </span>
              <span className={`r-rank-score ${isMe ? 'r-me' : ''}`}>{r.score.toLocaleString()}</span>
              {hoveredRank === r.rank && expandedRank !== r.rank && r.score > 0 && <ScoreTooltip entry={r} />}
              {expandedRank === r.rank && r.score > 0 && (
                <div className="r-rank-breakdown" style={{ width: '100%' }}>
                  <ScoreBar label="フォロワー" value={r.follower_score || 0} total={r.score} color="#C84B2F" />
                  <ScoreBar label="投稿" value={r.post_score || 0} total={r.score} color="rgba(200,75,47,0.7)" />
                  <ScoreBar label="いいね" value={r.like_score || 0} total={r.score} color="rgba(200,75,47,0.5)" />
                  <ScoreBar label="RT" value={r.rt_score || 0} total={r.score} color="rgba(200,75,47,0.4)" />
                  <ScoreBar label="国際" value={r.intl_bonus || 0} total={r.score} color="rgba(255,180,100,0.6)" />
                </div>
              )}
            </div>
          )
        })}
        {!expanded && data.length > INITIAL_COUNT && (
          <button onClick={() => setExpanded(true)} style={{
            width: '100%', padding: '10px', marginTop: 4, background: 'none',
            border: '0.5px solid var(--radar-border)', borderRadius: 6,
            color: 'var(--radar-muted)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            もっと見る（{data.length}人中 {INITIAL_COUNT}人表示）
          </button>
        )}
        {expanded && data.length > INITIAL_COUNT && (
          <button onClick={() => setExpanded(false)} style={{
            width: '100%', padding: '10px', marginTop: 4, background: 'none',
            border: '0.5px solid var(--radar-border)', borderRadius: 6,
            color: 'var(--radar-muted)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            閉じる
          </button>
        )}
      </div>
    </div>
  )
}

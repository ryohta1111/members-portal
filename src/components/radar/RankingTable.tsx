'use client'

import { useState, useEffect, useRef } from 'react'

interface RankEntry {
  rank: number; username: string; display_name: string
  profile_image_url: string | null; score: number
}

const INITIAL_COUNT = 10

export function RankingTable({ data, myUsername, eventTitle }: { data: RankEntry[]; myUsername: string | null; eventTitle: string }) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)
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
              className={`r-rank-row ${isMe ? 'r-me' : ''} ${visible ? 'r-visible' : ''}`}
              style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms' }}
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

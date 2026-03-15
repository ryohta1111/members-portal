'use client'

import { useState } from 'react'

interface BuzzPost {
  tweet_id: string
  text: string
  like_count: number
  retweet_count: number
  reply_count: number
  created_at: string
  author: {
    x_id: string
    username: string
    display_name: string
    profile_image_url: string | null
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  return `${days}日前`
}

const INITIAL_COUNT = 5

export function BuzzFeed({ data, myUsername }: { data: BuzzPost[]; myUsername: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? data : data.slice(0, INITIAL_COUNT)

  return (
    <div id="buzz" className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">バズった投稿</span>
        <span className="r-panel-badge">エンゲージメント上位</span>
      </div>
      <div className="r-buzz-list">
        {visible.map(p => {
          const isMe = myUsername && p.author.username.toLowerCase() === myUsername.toLowerCase()
          const initials = p.author.username.slice(0, 2).toUpperCase()
          return (
            <div key={p.tweet_id} className={`r-buzz-card ${isMe ? 'r-me' : ''}`}>
              <div className="r-buzz-header">
                <div className={`r-buzz-avatar ${isMe ? 'r-me' : ''}`} style={isMe ? { background: 'rgba(200,75,47,0.15)', color: '#C84B2F', borderColor: 'rgba(200,75,47,0.3)' } : {}}>
                  {p.author.profile_image_url
                    ? <img src={p.author.profile_image_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    : initials
                  }
                </div>
                <span className="r-buzz-username">
                  {p.author.display_name || p.author.username}
                  {isMe && <span className="r-you-badge">YOU</span>}
                </span>
                <span className="r-buzz-time">{timeAgo(p.created_at)}</span>
              </div>
              <div className="r-buzz-text">{p.text}</div>
              <div className="r-buzz-stats">
                <span className="r-buzz-stat">♥ {p.like_count.toLocaleString()}</span>
                <span className="r-buzz-stat">↺ {p.retweet_count.toLocaleString()}</span>
                <span className="r-buzz-stat">💬 {p.reply_count.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
        {data.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--radar-muted)', fontSize: 13 }}>データなし</div>}
        {!expanded && data.length > INITIAL_COUNT && (
          <button onClick={() => setExpanded(true)} style={{
            width: '100%', padding: '10px', marginTop: 4, background: 'none',
            border: '0.5px solid var(--radar-border)', borderRadius: 6,
            color: 'var(--radar-muted)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            もっと見る（{data.length}件中 {INITIAL_COUNT}件表示）
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

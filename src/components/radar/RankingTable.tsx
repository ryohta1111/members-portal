'use client'

interface RankEntry {
  rank: number; username: string; display_name: string
  profile_image_url: string | null; score: number
}

export function RankingTable({ data, myUsername, eventTitle }: { data: RankEntry[]; myUsername: string | null; eventTitle: string }) {
  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">影響ランキング</span>
        <span className="r-panel-sub">{eventTitle} 期間中</span>
      </div>
      <div className="r-ranking-list">
        {data.map(r => {
          const isMe = myUsername && r.username.toLowerCase() === myUsername.toLowerCase()
          const initials = r.username.slice(0, 2).toUpperCase()
          return (
            <div key={r.rank} className={`r-rank-row ${isMe ? 'r-me' : ''}`}>
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
      </div>
    </div>
  )
}

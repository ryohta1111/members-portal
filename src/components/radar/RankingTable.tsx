'use client'

interface RankEntry {
  rank: number; username: string; display_name: string
  profile_image_url: string | null; score: number
}

export function RankingTable({ data, myUsername, eventTitle }: { data: RankEntry[]; myUsername: string | null; eventTitle: string }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">影響ランキング</span>
        <span className="panel-sub">{eventTitle} 期間中</span>
      </div>
      <div className="ranking-list">
        {data.map(r => {
          const isMe = myUsername && r.username.toLowerCase() === myUsername.toLowerCase()
          const initials = r.username.slice(0, 2).toUpperCase()
          return (
            <div key={r.rank} className={`rank-row ${isMe ? 'me' : ''}`}>
              <span className={`rank-num ${isMe ? 'me' : ''}`}>{r.rank}</span>
              <div className={`rank-avatar ${isMe ? 'me' : ''}`}>
                {r.profile_image_url
                  ? <img src={r.profile_image_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                  : initials
                }
              </div>
              <span className="rank-name">
                {r.display_name || r.username}
                {isMe && <span className="you-badge">YOU</span>}
              </span>
              <span className={`rank-score ${isMe ? 'me' : ''}`}>{r.score.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

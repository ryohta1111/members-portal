'use client'

interface RankEntry {
  rank: number
  username: string
  display_name: string
  profile_image_url: string | null
  followers_count: number
  period_posts: number
  score: number
}

interface Props {
  data: RankEntry[]
  myUsername: string | null
}

export function RankingTable({ data, myUsername }: Props) {
  return (
    <div className="radar-ranking">
      <table className="radar-rank-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ユーザー</th>
            <th>フォロワー</th>
            <th>投稿数</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => {
            const isMe = myUsername && r.username.toLowerCase() === myUsername.toLowerCase()
            return (
              <tr key={r.rank} className={isMe ? 'me' : ''}>
                <td style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{r.rank}</td>
                <td>
                  <div className="radar-rank-user">
                    {r.profile_image_url && <img src={r.profile_image_url} className="radar-rank-avatar" alt="" />}
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        @{r.username}
                        {isMe && <span className="radar-you-badge" style={{ marginLeft: 6 }}>YOU</span>}
                      </div>
                      {r.display_name && <div style={{ fontSize: 11, color: 'var(--radar-muted)' }}>{r.display_name}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r.followers_count.toLocaleString()}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r.period_posts}</td>
                <td style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--brand)' }}>{r.score.toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

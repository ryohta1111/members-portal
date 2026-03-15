'use client'

interface ScoreData {
  score: number
  rank: number | null
  totalUsers: number
  follower_score: number
  post_score: number
  like_score: number
  rt_score: number
  intl_bonus: number
  username: string
}

export function PowerScore({ data }: { data: ScoreData | null }) {
  if (!data || data.score === 0) return null

  const maxScore = Math.max(data.follower_score, data.post_score, data.like_score, data.rt_score, data.intl_bonus, 1)
  const pct = (v: number) => `${Math.round((v / maxScore) * 100)}%`
  const topPct = data.rank && data.totalUsers > 0 ? Math.round((data.rank / data.totalUsers) * 100) : null

  return (
    <div className="r-score-row">
      <div className="r-score-total">
        <div className="r-score-label">CT Power Score</div>
        <div className="r-score-number">{data.score.toLocaleString()}</div>
        <div className="r-score-rank">{topPct ? `上位 ${topPct}%` : ''}</div>
      </div>
      <div className="r-score-card">
        <div className="r-score-card-title">スコア内訳 — {data.username}</div>
        <div className="r-score-bars">
          <div className="r-score-bar-row">
            <span className="r-score-bar-label">フォロワー</span>
            <div className="r-score-bar-bg"><div className="r-score-bar-fill" style={{ width: pct(data.follower_score) }} /></div>
            <span className="r-score-bar-val">+{data.follower_score}</span>
          </div>
          <div className="r-score-bar-row">
            <span className="r-score-bar-label">投稿数</span>
            <div className="r-score-bar-bg"><div className="r-score-bar-fill" style={{ width: pct(data.post_score) }} /></div>
            <span className="r-score-bar-val">+{data.post_score}</span>
          </div>
          <div className="r-score-bar-row">
            <span className="r-score-bar-label">いいね計</span>
            <div className="r-score-bar-bg"><div className="r-score-bar-fill" style={{ width: pct(data.like_score) }} /></div>
            <span className="r-score-bar-val">+{data.like_score}</span>
          </div>
          <div className="r-score-bar-row">
            <span className="r-score-bar-label">RT計</span>
            <div className="r-score-bar-bg"><div className="r-score-bar-fill" style={{ width: pct(data.rt_score) }} /></div>
            <span className="r-score-bar-val">+{data.rt_score}</span>
          </div>
          <div className="r-score-bar-row">
            <span className="r-score-bar-label">国際リーチ</span>
            <div className="r-score-bar-bg"><div className="r-score-bar-fill" style={{ width: pct(data.intl_bonus), background: 'rgba(200,75,47,0.5)' }} /></div>
            <span className="r-score-bar-val" style={{ color: 'rgba(200,75,47,0.6)' }}>+{data.intl_bonus}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

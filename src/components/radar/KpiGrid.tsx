'use client'

interface Props {
  totalPosts: number
  totalReach: number
  countries: number
  users: number
  myRank: number | null
}

function fmtNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

export function KpiGrid({ totalPosts, totalReach, countries, users, myRank }: Props) {
  return (
    <div className="radar-kpi">
      <div className="radar-kpi-card">
        <div className="radar-kpi-label">投稿数</div>
        <div className="radar-kpi-val">{fmtNum(totalPosts)}</div>
      </div>
      <div className="radar-kpi-card">
        <div className="radar-kpi-label">リーチ</div>
        <div className="radar-kpi-val">{fmtNum(totalReach)}</div>
      </div>
      <div className="radar-kpi-card">
        <div className="radar-kpi-label">参加国</div>
        <div className="radar-kpi-val">{countries}</div>
      </div>
      <div className="radar-kpi-card">
        <div className="radar-kpi-label">ユーザー</div>
        <div className="radar-kpi-val">{fmtNum(users)}</div>
      </div>
      <div className={`radar-kpi-card ${myRank ? 'highlight' : ''}`}>
        <div className="radar-kpi-label">あなた</div>
        <div className="radar-kpi-val">{myRank ? `#${myRank}` : '—'}</div>
      </div>
    </div>
  )
}

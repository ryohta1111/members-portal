'use client'

interface Props {
  totalPosts: number; totalReach: number; countries: number; users: number; myRank: number | null; totalUsers: number
}

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toLocaleString()
}

export function KpiGrid({ totalPosts, totalReach, countries, users, myRank, totalUsers }: Props) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">投稿数</div>
        <div className="kpi-value">{fmt(totalPosts)}</div>
        <div className="kpi-sub">累計</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">リーチ</div>
        <div className="kpi-value">{fmt(totalReach)}</div>
        <div className="kpi-sub">ユニーク</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">参加国</div>
        <div className="kpi-value">{countries}</div>
        <div className="kpi-sub">国・地域</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">ユーザー</div>
        <div className="kpi-value">{fmt(users)}</div>
        <div className="kpi-sub">参加者</div>
      </div>
      <div className="kpi-card me">
        <div className="kpi-label">あなたの順位</div>
        <div className="kpi-value brand">{myRank ? `#${myRank}` : '—'}</div>
        <div className="kpi-sub brand">{myRank ? `${totalUsers}人中` : ''}</div>
      </div>
    </div>
  )
}

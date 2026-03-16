'use client'

import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  totalPosts: number; totalReach: number; countries: number; users: number; myRank: number | null; totalUsers: number
}

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toLocaleString()
}

export function KpiGrid({ totalPosts, totalReach, countries, users, myRank, totalUsers }: Props) {
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true)
        el.classList.add('r-visible')
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const postCount = useCountUp(totalPosts, 1200, started)
  const reachCount = useCountUp(totalReach, 1400, started)
  const countryCount = useCountUp(countries, 800, started)
  const userCount = useCountUp(users, 1000, started)

  return (
    <div ref={ref} className="r-kpi-grid r-fade-in">
      <div className="r-kpi-card r-delay-1">
        <div className="r-kpi-label">投稿数</div>
        <div className="r-kpi-value" suppressHydrationWarning>{fmt(postCount)}</div>
        <div className="r-kpi-sub">累計</div>
      </div>
      <div className="r-kpi-card r-delay-2">
        <div className="r-kpi-label">リーチ</div>
        <div className="r-kpi-value" suppressHydrationWarning>{fmt(reachCount)}</div>
        <div className="r-kpi-sub">ユニーク</div>
      </div>
      <div className="r-kpi-card r-delay-3">
        <div className="r-kpi-label">参加国</div>
        <div className="r-kpi-value" suppressHydrationWarning>{countryCount}</div>
        <div className="r-kpi-sub">国・地域</div>
      </div>
      <div className="r-kpi-card r-delay-4">
        <div className="r-kpi-label">ユーザー</div>
        <div className="r-kpi-value" suppressHydrationWarning>{fmt(userCount)}</div>
        <div className="r-kpi-sub">参加者</div>
      </div>
      <div className="r-kpi-card r-me r-delay-5">
        <div className="r-kpi-label">あなたの順位</div>
        <div className="r-kpi-value brand">{myRank ? `#${myRank}` : '—'}</div>
        <div className="r-kpi-sub brand">{myRank ? `${totalUsers}人中` : ''}</div>
      </div>
    </div>
  )
}

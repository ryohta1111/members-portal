'use client'

import { useEffect, useState } from 'react'

interface Event {
  id: string
  title: string
  end_at: string
}

export function EventBanner({ event }: { event: Event | null }) {
  const [cd, setCd] = useState({ d: '00', h: '00', m: '00', s: '00' })

  useEffect(() => {
    if (!event) return
    function update() {
      const diff = Math.max(0, new Date(event!.end_at).getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      const pad = (n: number) => String(n).padStart(2, '0')
      setCd({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) })
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [event])

  if (!event) return null

  return (
    <div className="r-event-banner">
      <div className="r-event-left">
        <div className="r-live-badge">LIVE</div>
        <span className="r-event-name">{event.title} — 開催中</span>
      </div>
      <div className="r-countdown">
        <div className="r-cd-block"><div className="r-cd-num">{cd.d}</div><div className="r-cd-label">日</div></div>
        <div className="r-cd-sep">:</div>
        <div className="r-cd-block"><div className="r-cd-num">{cd.h}</div><div className="r-cd-label">時</div></div>
        <div className="r-cd-sep">:</div>
        <div className="r-cd-block"><div className="r-cd-num">{cd.m}</div><div className="r-cd-label">分</div></div>
        <div className="r-cd-sep">:</div>
        <div className="r-cd-block"><div className="r-cd-num">{cd.s}</div><div className="r-cd-label">秒</div></div>
        <span className="r-countdown-text">残り</span>
      </div>
    </div>
  )
}

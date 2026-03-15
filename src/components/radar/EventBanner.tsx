'use client'

import { useEffect, useState } from 'react'

interface Event {
  id: string
  title: string
  end_at: string
}

export function EventBanner({ event }: { event: Event | null }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!event) return
    function update() {
      const diff = new Date(event!.end_at).getTime() - Date.now()
      if (diff <= 0) { setRemaining('終了'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${String(d).padStart(2, '0')}日 : ${String(h).padStart(2, '0')}時 : ${String(m).padStart(2, '0')}分`)
    }
    update()
    const iv = setInterval(update, 60000)
    return () => clearInterval(iv)
  }, [event])

  if (!event) return null

  return (
    <div className="radar-event-banner">
      <div className="radar-event-live">
        <div className="radar-event-dot" />
        <span style={{ fontWeight: 600 }}>LIVE</span>
        <span>{event.title} — 開催中</span>
      </div>
      <div className="radar-countdown">{remaining} 残り</div>
    </div>
  )
}

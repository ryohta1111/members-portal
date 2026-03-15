'use client'

const TABS = [
  { id: 'map', label: '世界地図' },
  { id: 'network', label: 'ネットワーク' },
  { id: 'buzz', label: 'バズ投稿' },
  { id: 'ranking', label: 'ランキング' },
]

export function ContentTabs() {
  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="r-tab-bar">
      {TABS.map(t => (
        <button key={t.id} className="r-tab-item" onClick={() => scrollTo(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

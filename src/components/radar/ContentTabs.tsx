'use client'

const TABS = [
  { id: 'map', label: '世界地図' },
  { id: 'network', label: 'ネットワーク' },
  { id: 'buzz', label: 'バズ投稿' },
  { id: 'ranking', label: 'ランキング' },
]

export function ContentTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="r-tab-bar">
      {TABS.map(t => (
        <button key={t.id} className={`r-tab-item ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

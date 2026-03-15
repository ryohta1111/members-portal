'use client'

const TABS = [
  { id: 'map', label: '世界地図' },
  { id: 'ranking', label: 'ランキング' },
]

interface Props {
  active: string
  onChange: (id: string) => void
}

export function ContentTabs({ active, onChange }: Props) {
  return (
    <div className="radar-ctabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`radar-ctab ${active === t.id ? 'on' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

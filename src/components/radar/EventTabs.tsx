'use client'

interface Event {
  id: string
  title: string
}

interface Props {
  events: Event[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function EventTabs({ events, selectedId, onSelect }: Props) {
  return (
    <div className="radar-etabs">
      {events.map(e => (
        <button
          key={e.id}
          className={`radar-etab ${selectedId === e.id ? 'on' : ''}`}
          onClick={() => onSelect(e.id)}
        >
          {e.title}
        </button>
      ))}
      <button
        className={`radar-etab ${selectedId === null ? 'on' : ''}`}
        onClick={() => onSelect(null)}
      >
        全期間
      </button>
    </div>
  )
}

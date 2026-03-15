'use client'

interface Event { id: string; title: string }
interface Props { events: Event[]; selectedId: string | null; onSelect: (id: string | null) => void }

export function EventTabs({ events, selectedId, onSelect }: Props) {
  return (
    <div className="event-tabs">
      {events.map(e => (
        <button key={e.id} className={`event-tab ${selectedId === e.id ? 'active' : ''}`} onClick={() => onSelect(e.id)}>
          {e.title}
        </button>
      ))}
      <button className={`event-tab ${selectedId === null ? 'active' : ''}`} onClick={() => onSelect(null)}>
        全期間
      </button>
    </div>
  )
}

'use client'

export function MapView() {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">拡散マップ</span>
        <span className="panel-badge">日本語CT特化</span>
      </div>
      <div className="map-container">
        <svg width="100%" height="100%" viewBox="0 0 500 220" style={{ position: 'absolute', top: 0, left: 0 }}>
          <rect width="500" height="220" fill="#161512" />
          <rect x="290" y="30" width="50" height="70" rx="4" fill="#C84B2F" opacity="0.75" />
          <rect x="258" y="38" width="26" height="42" rx="3" fill="#C84B2F" opacity="0.35" />
          <rect x="60" y="50" width="90" height="60" rx="4" fill="#C84B2F" opacity="0.12" />
          <rect x="190" y="40" width="50" height="60" rx="3" fill="#C84B2F" opacity="0.08" />
          <line x1="250" y1="110" x2="315" y2="65" stroke="#C84B2F" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          <line x1="250" y1="110" x2="105" y2="80" stroke="#C84B2F" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.2" />
          <circle cx="315" cy="65" r="4" fill="#C84B2F" opacity="0.9" />
          <circle cx="105" cy="80" r="2.5" fill="#C84B2F" opacity="0.3" />
          <circle cx="250" cy="110" r="5" fill="#C84B2F" />
          <text x="325" y="62" fontSize="9" fill="rgba(200,75,47,0.7)" fontFamily="monospace">JP</text>
        </svg>
      </div>
    </div>
  )
}

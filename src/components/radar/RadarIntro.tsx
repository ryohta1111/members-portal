'use client'

export function RadarIntro({ onDone }: { onDone: () => void }) {
  return (
    <div className="r-intro" id="radar-intro">
      <div className="r-scan-line" />
      <svg className="radar-svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="sweep-grad" cx="0%" cy="50%" r="100%">
            <stop offset="0%" stopColor="#C84B2F" stopOpacity={0} />
            <stop offset="100%" stopColor="#C84B2F" stopOpacity={0.8} />
          </radialGradient>
        </defs>
        <circle className="r-ring r-ring-1" cx="80" cy="80" r="20" />
        <circle className="r-ring r-ring-2" cx="80" cy="80" r="40" />
        <circle className="r-ring r-ring-3" cx="80" cy="80" r="60" />
        <circle className="r-ring r-ring-4" cx="80" cy="80" r="75" />
        <line className="r-crosshair" x1="80" y1="5" x2="80" y2="155" />
        <line className="r-crosshair" x1="5" y1="80" x2="155" y2="80" />
        <g className="r-sweep">
          <path d="M80 80 L80 5 A75 75 0 0 1 155 80 Z" fill="url(#sweep-grad)" opacity="0.35" />
        </g>
        <circle cx="80" cy="80" r="2" fill="#C84B2F" style={{ opacity: 0, animation: 'fadeIn .2s ease forwards 1.4s' }} />
        <circle cx="118" cy="48" r="2.5" fill="#C84B2F" style={{ opacity: 0, animation: 'fadeIn .1s ease forwards 1.7s' }} />
        <circle cx="55" cy="95" r="1.5" fill="#C84B2F" style={{ opacity: 0, animation: 'fadeIn .1s ease forwards 2.1s' }} />
      </svg>
      <div className="r-term-lines">
        <div className="r-term-line r-tl-1">&gt; CT Radarに接続中...</div>
        <div className="r-term-line r-tl-2">&gt; トークンゲートを確認中...</div>
        <div className="r-term-line r-tl-3">&gt; 035HP残高を検証: 保有確認</div>
        <div className="r-term-line r-tl-4">&gt; #押忍雄祭 データを読み込み中...</div>
        <div className="r-term-line r-tl-5 white">&gt; アクセスを許可します</div>
      </div>
      <div className="r-access-granted">Access Granted</div>
    </div>
  )
}

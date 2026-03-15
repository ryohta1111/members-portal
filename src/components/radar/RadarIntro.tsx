'use client'

import { useEffect, useState } from 'react'

const LINES = [
  { text: '> CT Radarに接続中...', delay: 1000 },
  { text: '> トークンゲートを確認中...', delay: 1500 },
  { text: '> 035HP残高を検証: 保有確認', delay: 2000 },
  { text: '> #押忍雄祭 データを読み込み中...', delay: 2500 },
  { text: '> アクセスを許可します', delay: 2900, white: true },
]

export function RadarIntro({ onDone }: { onDone: () => void }) {
  const [rings, setRings] = useState([false, false, false, false])
  const [sweep, setSweep] = useState(false)
  const [cross, setCross] = useState(false)
  const [lines, setLines] = useState<boolean[]>(LINES.map(() => false))
  const [granted, setGranted] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Rings
    rings.forEach((_, i) => {
      setTimeout(() => setRings(prev => { const n = [...prev]; n[i] = true; return n }), 500 + i * 250)
    })
    // Sweep
    setTimeout(() => setSweep(true), 800)
    // Cross
    setTimeout(() => setCross(true), 1400)
    // Terminal lines
    LINES.forEach((line, i) => {
      setTimeout(() => setLines(prev => { const n = [...prev]; n[i] = true; return n }), line.delay)
    })
    // Granted
    setTimeout(() => setGranted(true), 3300)
    // Fade out
    setTimeout(() => setFadeOut(true), 3900)
    setTimeout(onDone, 4500)
  }, [onDone])

  return (
    <div className={`radar-intro ${fadeOut ? 'fade-out' : ''}`}>
      <div className="radar-scanline" />

      <div className="radar-svg-wrap">
        <svg viewBox="0 0 200 200" width="200" height="200">
          <defs>
            <radialGradient id="sweepGrad">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(200,75,47,0.3)" />
            </radialGradient>
          </defs>
          {[80, 60, 40, 20].map((r, i) => (
            <circle key={i} cx="100" cy="100" r={r} className={`radar-ring ${rings[i] ? 'show' : ''}`} />
          ))}
          <path
            d="M100,100 L100,20 A80,80 0 0,1 169,54 Z"
            className={`radar-sweep ${sweep ? 'show' : ''}`}
          />
          <line x1="100" y1="10" x2="100" y2="190" className={`radar-cross ${cross ? 'show' : ''}`} />
          <line x1="10" y1="100" x2="190" y2="100" className={`radar-cross ${cross ? 'show' : ''}`} />
        </svg>
      </div>

      <div className="radar-terminal">
        {LINES.map((line, i) => (
          <div key={i} className={`radar-term-line ${lines[i] ? 'show' : ''} ${line.white ? 'white' : ''}`}>
            {line.text}
          </div>
        ))}
      </div>

      <div className={`radar-granted ${granted ? 'show' : ''}`}>ACCESS GRANTED</div>
    </div>
  )
}

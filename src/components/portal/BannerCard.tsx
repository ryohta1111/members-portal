'use client'

interface BannerData {
  banner?: {
    bg_style: string | null
    tag_text: string | null
    tag_color: string | null
    copy: string | null
    cta_text: string | null
    cta_url: string | null
    logo_color: string | null
    logo_text_color: string | null
    circle1: { color: string; top?: string; right?: string; bottom?: string; left?: string; size: string } | null
    circle2: { color: string; top?: string; right?: string; bottom?: string; left?: string; size: string } | null
  }
  ticker: string
  name: string
}

export function BannerCard({ data }: { data: BannerData }) {
  const b = data.banner
  if (!b) return null

  const sym = data.ticker.replace('$', '').slice(0, 3).toUpperCase()

  function circleStyle(c: BannerData['banner'] extends infer T ? T extends { circle1: infer C } ? C : never : never) {
    if (!c) return {}
    return {
      background: c.color,
      width: c.size,
      height: c.size,
      top: c.top || 'auto',
      right: c.right || 'auto',
      bottom: c.bottom || 'auto',
      left: c.left || 'auto',
    }
  }

  return (
    <div
      className="ban"
      style={{ background: b.bg_style || '#1a1a1a' }}
      onClick={() => b.cta_url && window.open(b.cta_url, '_blank')}
    >
      <div className="bdeco">
        {b.circle1 && <div className="bc" style={circleStyle(b.circle1)} />}
        {b.circle2 && <div className="bc" style={circleStyle(b.circle2)} />}
      </div>
      <div className="bad">PR</div>
      <div className="blogo">
        <div className="bli" style={{ background: b.logo_color || 'rgba(255,255,255,0.1)', color: b.logo_text_color || '#fff' }}>
          {sym}
        </div>
        <div>
          <div className="bln">{data.ticker}</div>
          <div className="bls">Solana</div>
        </div>
      </div>
      <div className="bcont">
        {b.tag_text && (
          <div className="btag" style={{ background: `${b.tag_color}33`, color: b.tag_color || '#fff' }}>
            {b.tag_text}
          </div>
        )}
        {b.copy && <div className="bcopy" dangerouslySetInnerHTML={{ __html: b.copy }} />}
        {b.cta_text && <div className="bcta">{b.cta_text}</div>}
      </div>
      <div className="bov" />
    </div>
  )
}

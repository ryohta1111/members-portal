'use client'

const FLAGS: Record<string, string> = {
  JP: '🇯🇵', US: '🇺🇸', KR: '🇰🇷', TW: '🇹🇼', TH: '🇹🇭', VN: '🇻🇳',
  PH: '🇵🇭', ID: '🇮🇩', MY: '🇲🇾', SG: '🇸🇬', IN: '🇮🇳', CN: '🇨🇳',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', NG: '🇳🇬', TR: '🇹🇷',
  AE: '🇦🇪', AU: '🇦🇺', CA: '🇨🇦',
}
const NAMES: Record<string, string> = {
  JP: '日本', US: '米国', KR: '韓国', TW: '台湾', TH: 'タイ', VN: 'ベトナム',
  PH: 'フィリピン', ID: 'インドネシア', MY: 'マレーシア', SG: 'シンガポール',
  IN: 'インド', CN: '中国', GB: '英国', DE: 'ドイツ', FR: 'フランス',
  BR: 'ブラジル', NG: 'ナイジェリア', TR: 'トルコ', AE: 'UAE', AU: '豪州', CA: 'カナダ',
}

interface CountryData { country_code: string; count: number }

export function CountryList({ data }: { data: CountryData[] }) {
  const top6 = data.slice(0, 6)
  const max = top6[0]?.count || 1
  const total = data.reduce((s, c) => s + c.count, 0)

  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">参加国 TOP6</span>
        <span className="r-panel-sub">{data.length}カ国 · {total.toLocaleString()}投稿</span>
      </div>
      <div className="r-country-grid">
        {top6.map(c => {
          const pct = total > 0 ? ((c.count / total) * 100).toFixed(1) : '0'
          return (
            <div key={c.country_code} className="r-country-item">
              <div className="r-country-flag">{FLAGS[c.country_code] || '🌍'}</div>
              <div className="r-country-name">{NAMES[c.country_code] || c.country_code}</div>
              <div className="r-country-count">{c.count.toLocaleString()}</div>
              <div className="r-country-label">投稿 · {pct}%</div>
              <div className="r-country-bar">
                <div className="r-country-bar-fill" style={{ width: `${(c.count / max) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

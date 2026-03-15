'use client'

const FLAGS: Record<string, string> = {
  JP: '\u{1F1EF}\u{1F1F5}', US: '\u{1F1FA}\u{1F1F8}', KR: '\u{1F1F0}\u{1F1F7}', TW: '\u{1F1F9}\u{1F1FC}', TH: '\u{1F1F9}\u{1F1ED}', VN: '\u{1F1FB}\u{1F1F3}',
  PH: '\u{1F1F5}\u{1F1ED}', ID: '\u{1F1EE}\u{1F1E9}', MY: '\u{1F1F2}\u{1F1FE}', SG: '\u{1F1F8}\u{1F1EC}', IN: '\u{1F1EE}\u{1F1F3}', CN: '\u{1F1E8}\u{1F1F3}',
  GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}', BR: '\u{1F1E7}\u{1F1F7}', NG: '\u{1F1F3}\u{1F1EC}', TR: '\u{1F1F9}\u{1F1F7}',
  AE: '\u{1F1E6}\u{1F1EA}', AU: '\u{1F1E6}\u{1F1FA}', CA: '\u{1F1E8}\u{1F1E6}',
}

const NAMES: Record<string, string> = {
  JP: '日本', US: 'アメリカ', KR: '韓国', TW: '台湾', TH: 'タイ', VN: 'ベトナム',
  PH: 'フィリピン', ID: 'インドネシア', MY: 'マレーシア', SG: 'シンガポール',
  IN: 'インド', CN: '中国', GB: 'イギリス', DE: 'ドイツ', FR: 'フランス',
  BR: 'ブラジル', NG: 'ナイジェリア', TR: 'トルコ', AE: 'UAE', AU: 'オーストラリア', CA: 'カナダ',
}

interface CountryData {
  country_code: string
  count: number
}

export function CountryList({ data }: { data: CountryData[] }) {
  const top6 = data.slice(0, 6)
  const max = top6[0]?.count || 1

  return (
    <div className="radar-country-wrap">
      <div className="radar-country-title">参加国 TOP6</div>
      {top6.map(c => (
        <div key={c.country_code} className="radar-country-item">
          <span className="radar-country-flag">{FLAGS[c.country_code] || '\u{1F30D}'}</span>
          <span className="radar-country-name">{NAMES[c.country_code] || c.country_code}</span>
          <div className="radar-country-bar-wrap">
            <div className="radar-country-bar" style={{ width: `${(c.count / max) * 100}%` }} />
          </div>
          <span className="radar-country-count">{c.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

'use client'

const FLAGS: Record<string, string> = {
  JP: '\u{1F1EF}\u{1F1F5}', US: '\u{1F1FA}\u{1F1F8}', KR: '\u{1F1F0}\u{1F1F7}', TW: '\u{1F1F9}\u{1F1FC}', TH: '\u{1F1F9}\u{1F1ED}', VN: '\u{1F1FB}\u{1F1F3}',
  PH: '\u{1F1F5}\u{1F1ED}', ID: '\u{1F1EE}\u{1F1E9}', MY: '\u{1F1F2}\u{1F1FE}', SG: '\u{1F1F8}\u{1F1EC}', IN: '\u{1F1EE}\u{1F1F3}', CN: '\u{1F1E8}\u{1F1F3}',
  GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}', BR: '\u{1F1E7}\u{1F1F7}', NG: '\u{1F1F3}\u{1F1EC}', TR: '\u{1F1F9}\u{1F1F7}',
  AE: '\u{1F1E6}\u{1F1EA}', AU: '\u{1F1E6}\u{1F1FA}', CA: '\u{1F1E8}\u{1F1E6}',
}
const NAMES: Record<string, string> = {
  JP: '\u65E5\u672C', US: '\u7C73\u56FD', KR: '\u97D3\u56FD', TW: '\u53F0\u6E7E', TH: '\u30BF\u30A4', VN: '\u30D9\u30C8\u30CA\u30E0',
  PH: '\u30D5\u30A3\u30EA\u30D4\u30F3', ID: '\u30A4\u30F3\u30C9\u30CD\u30B7\u30A2', MY: '\u30DE\u30EC\u30FC\u30B7\u30A2', SG: 'SG',
  IN: '\u30A4\u30F3\u30C9', CN: '\u4E2D\u56FD', GB: '\u82F1\u56FD', DE: '\u30C9\u30A4\u30C4', FR: '\u30D5\u30E9\u30F3\u30B9',
  BR: '\u30D6\u30E9\u30B8\u30EB', NG: '\u30CA\u30A4\u30B8\u30A7\u30EA\u30A2', TR: '\u30C8\u30EB\u30B3', AE: 'UAE', AU: '\u8C6A\u5DDE', CA: '\u30AB\u30CA\u30C0',
}

interface CountryData { country_code: string; count: number }

export function CountryList({ data }: { data: CountryData[] }) {
  const top6 = data.slice(0, 6)
  const max = top6[0]?.count || 1

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">参加国 TOP6</span>
      </div>
      <div className="country-grid">
        {top6.map(c => (
          <div key={c.country_code} className="country-item">
            <div className="country-flag">{FLAGS[c.country_code] || '\u{1F30D}'}</div>
            <div className="country-name">{NAMES[c.country_code] || c.country_code}</div>
            <div className="country-count">{c.count.toLocaleString()}</div>
            <div className="country-bar">
              <div className="country-bar-fill" style={{ width: `${(c.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HowItWorks() {
  const steps = [
    { n: 1, title: 'Connect Wallet', desc: 'Connect Phantom to get started.' },
    { n: 2, title: 'Hold 035HP', desc: 'Hold any of the 16 eligible tokens.' },
    { n: 3, title: 'Unlock Access', desc: 'All community features unlock.' },
    { n: 4, title: 'Participate', desc: 'Vote, chat, stake, and earn.' },
  ]

  return (
    <div id="howit" style={{ background: 'var(--p-bg)' }}>
      <div className="wrap">
        <div className="p-sec">
          <div className="sh">
            <div>
              <div className="st">How it Works</div>
              <div className="ss">Get started in four steps.</div>
            </div>
          </div>
          <div className="steps">
            {steps.map(s => (
              <div key={s.n} className="step">
                <div className="sn">{s.n}</div>
                <div className="stit">{s.title}</div>
                <div className="sd">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
          <div ref={ref} className={`steps p-fade-in ${visible ? 'p-visible' : ''}`}>
            {steps.map((s, i) => (
              <div key={s.n} className={`step p-delay-${i + 1}`}>
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

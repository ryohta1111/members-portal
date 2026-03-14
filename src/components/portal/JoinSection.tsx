'use client'

import { useEffect, useState } from 'react'

interface CommunityLink {
  platform: string
  url: string
  is_active: boolean
}

const ICONS: Record<string, { bg: string; label: string; sub: string; icon: React.ReactNode }> = {
  x: {
    bg: '#E7F3FF',
    label: 'X (Twitter)',
    sub: 'Follow for updates',
    icon: <span style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>&#x1D54F;</span>,
  },
  discord: {
    bg: '#EEF2FF',
    label: 'Discord',
    sub: 'Join the server',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#4338CA">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
      </svg>
    ),
  },
  telegram: {
    bg: '#F0FDF4',
    label: 'Telegram',
    sub: 'Join the channel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#15803D">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 13.88l-2.956-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.722.706z" />
      </svg>
    ),
  },
}

export function JoinSection() {
  const [links, setLinks] = useState<CommunityLink[]>([])

  useEffect(() => {
    // For now, use default links. When Supabase table is ready, fetch from API.
    setLinks([
      { platform: 'x', url: 'https://x.com/035HP_', is_active: true },
      { platform: 'discord', url: 'https://discord.gg/035hp', is_active: true },
      { platform: 'telegram', url: 'https://t.me/035hp', is_active: true },
    ])
  }, [])

  return (
    <div id="join" style={{ background: 'var(--p-surface)' }}>
      <div className="wrap">
        <div className="p-sec">
          <div className="sh">
            <div>
              <div className="st">Join the Community</div>
              <div className="ss">Follow and connect with 035HP.</div>
            </div>
          </div>
          <div className="jg">
            {links.filter(l => l.is_active).map(l => {
              const info = ICONS[l.platform]
              if (!info) return null
              return (
                <a key={l.platform} className="jc" href={l.url} target="_blank" rel="noopener noreferrer">
                  <div className="ji" style={{ background: info.bg }}>{info.icon}</div>
                  <div>
                    <div className="jl">{info.label}</div>
                    <div className="jsub">{info.sub}</div>
                  </div>
                  <span className="jarrow">→</span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

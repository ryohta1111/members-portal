'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const HELIUS_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || ''

// 16 eligible token mints (to be filled with actual addresses)
const ELIGIBLE_MINTS: string[] = [
  // These will be populated from Supabase tokens table mint_address
]

const FEATURES = [
  {
    id: 'vote',
    name: 'Vote',
    desc: 'Community voting',
    href: '/vote',
    iconBg: '#EEF2FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    id: 'chat',
    name: 'Chat',
    desc: 'Member chat room',
    href: '/chat',
    iconBg: '#F0FDF4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: 'staking',
    name: 'Staking',
    desc: 'Token staking rewards',
    href: '/staking',
    iconBg: '#FFF7ED',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#C2570B" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'game',
    name: 'Game',
    desc: 'Community mini games',
    href: '/game',
    iconBg: '#FEF0EC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#C84B2F" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
]

export function FeatureCards() {
  const { publicKey, connected } = useWallet()
  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!connected || !publicKey) {
      setHasToken(null)
      return
    }
    checkTokenHolding(publicKey.toString())
  }, [connected, publicKey])

  async function checkTokenHolding(wallet: string) {
    try {
      // Check both Token Program and Token-2022
      const [res1, res2] = await Promise.all([
        fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
            params: [wallet, { programId: TOKEN_PROGRAM_ID }, { encoding: 'jsonParsed' }],
          }),
        }),
        fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 2, method: 'getTokenAccountsByOwner',
            params: [wallet, { programId: TOKEN_2022_PROGRAM_ID }, { encoding: 'jsonParsed' }],
          }),
        }),
      ])

      const data1 = await res1.json()
      const data2 = await res2.json()
      const allAccounts = [
        ...(data1.result?.value || []),
        ...(data2.result?.value || []),
      ]

      // Fetch eligible mints from tokens API
      let eligibleMints: string[] = ELIGIBLE_MINTS
      try {
        const tokRes = await fetch('/api/tokens')
        const tokData = await tokRes.json()
        eligibleMints = (tokData.tokens || [])
          .filter((t: any) => t.mint_address)
          .map((t: any) => t.mint_address)
      } catch {}

      // Check if any account holds an eligible token with balance > 0
      const holds = allAccounts.some((acc: any) => {
        const info = acc.account?.data?.parsed?.info
        if (!info) return false
        const mint = info.mint
        const amount = parseFloat(info.tokenAmount?.uiAmountString || '0')
        return amount > 0 && eligibleMints.includes(mint)
      })

      setHasToken(holds)
    } catch {
      setHasToken(false)
    }
  }

  function handleClick(feature: typeof FEATURES[0]) {
    if (!connected) return
    if (hasToken === false) return
    if (feature.href.startsWith('http')) {
      window.open(feature.href, '_blank')
    } else {
      router.push(feature.href)
    }
  }

  function getBadgeText() {
    if (!connected) return 'Holders Only'
    if (hasToken === false) return '035HP required'
    return 'Restricted'
  }

  return (
    <div id="features" style={{ background: 'var(--p-bg)' }}>
      <div className="wrap">
        <div className="p-sec">
          <div className="sh">
            <div>
              <div className="st">Community Features</div>
              <div className="ss">Core functions for 035HP holders.</div>
            </div>
          </div>
          <div className="fg">
            {FEATURES.map(f => (
              <div
                key={f.id}
                className={`fc ${!connected || hasToken === false ? 'locked' : ''}`}
                onClick={() => handleClick(f)}
              >
                <div className="lk">{getBadgeText()}</div>
                <div className="fi" style={{ background: f.iconBg }}>
                  {f.icon}
                </div>
                <div className="fn">{f.name}</div>
                <div className="fd">{f.desc} · Holders Only</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

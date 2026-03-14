'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const NAV_ITEMS = [
  { href: '/vote', label: 'Vote' },
  { href: '/staking', label: 'Staking' },
  { href: '/game', label: 'Game' },
  { href: '/chat', label: 'Chat' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <div className="p-hdr">
      <Link href="/" className="p-logo" style={{ textDecoration: 'none', color: 'inherit' }}>035HP</Link>
      <nav className="p-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: pathname?.startsWith(item.href) ? 'var(--p-text)' : undefined,
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <WalletMultiButton />
    </div>
  )
}

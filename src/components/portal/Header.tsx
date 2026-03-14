'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Header() {
  return (
    <div className="p-hdr">
      <div className="p-logo">035HP</div>
      <nav className="p-nav">
        <a href="#features">Features</a>
        <a href="#tokens">Tokens</a>
        <a href="#howit">How it Works</a>
        <a href="#join">Join</a>
      </nav>
      <WalletMultiButton className="p-connect-btn" />
    </div>
  )
}

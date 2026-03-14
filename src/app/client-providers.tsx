'use client'

import dynamic from 'next/dynamic'
import './portal.css'
import { Ticker } from '@/components/portal/Ticker'

const Providers = dynamic(
  () => import('./providers').then((m) => m.Providers),
  { ssr: false }
)

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Ticker />
      {children}
    </Providers>
  )
}

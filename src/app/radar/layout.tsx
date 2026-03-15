import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CT Radar — 035HP!',
  description: '035HPコミュニティのX上の拡散・影響を可視化',
}

export default function RadarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

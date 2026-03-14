'use client'

import { Header } from '@/components/portal/Header'
import { Hero } from '@/components/portal/Hero'
import { FeatureCards } from '@/components/portal/FeatureCards'
import { TokenDashboard } from '@/components/portal/TokenDashboard'
import { HowItWorks } from '@/components/portal/HowItWorks'
import { JoinSection } from '@/components/portal/JoinSection'
import { Footer } from '@/components/portal/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <FeatureCards />
      <div className="p-dv" />
      <TokenDashboard />
      <div className="p-dv" />
      <HowItWorks />
      <div className="p-dv" />
      <JoinSection />
      <Footer />
    </>
  )
}

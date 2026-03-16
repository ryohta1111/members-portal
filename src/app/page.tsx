'use client'

import { useEffect, useRef } from 'react'
import { Header } from '@/components/portal/Header'
import { Hero } from '@/components/portal/Hero'
import { FeatureCards } from '@/components/portal/FeatureCards'
import { TokenDashboard } from '@/components/portal/TokenDashboard'
import { HowItWorks } from '@/components/portal/HowItWorks'
import { JoinSection } from '@/components/portal/JoinSection'
import { Footer } from '@/components/portal/Footer'

export default function Home() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return
    function onMove(e: MouseEvent) {
      glow!.style.left = `${e.clientX}px`
      glow!.style.top = `${e.clientY}px`
      glow!.classList.add('active')
    }
    function onLeave() { glow!.classList.remove('active') }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="cursor-glow" />
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

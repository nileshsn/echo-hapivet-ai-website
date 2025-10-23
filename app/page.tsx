"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroSection from "@/components/home/hero-section"
import BenefitsSection from "@/components/home/benefits-section"
import TestimonialsSection from "@/components/home/testimonials-section"
import FooterCTA from "@/components/home/footer-cta"
import DemoModal from "@/components/modals/demo-modal"

export default function Home() {
  const [showDemoModal, setShowDemoModal] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onWatchDemo={() => setShowDemoModal(true)} />
        <BenefitsSection />
        <TestimonialsSection />
        <FooterCTA />
      </main>
      <Footer />
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  )
}

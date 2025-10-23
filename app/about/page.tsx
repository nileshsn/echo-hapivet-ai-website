"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import CompanyStory from "@/components/about/company-story"
import TeamSection from "@/components/about/team-section"
import StatsSection from "@/components/about/stats-section"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CompanyStory />
        <TeamSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}

"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import FeaturesIntro from "@/components/features/features-intro"
import SchedulingDemo from "@/components/features/scheduling-demo"
import DiagnosisDemo from "@/components/features/diagnosis-demo"
import AdditionalFeatures from "@/components/features/additional-features"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <FeaturesIntro />
        <SchedulingDemo />
        <DiagnosisDemo />
        <AdditionalFeatures />
      </main>
      <Footer />
    </div>
  )
}

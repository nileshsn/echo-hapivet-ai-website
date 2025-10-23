"use client"

import Link from "next/link"

interface HeroSectionProps {
  onWatchDemo: () => void
}

export default function HeroSection({ onWatchDemo }: HeroSectionProps) {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 text-6xl">🐾</div>
        <div className="absolute bottom-20 left-10 text-5xl">🐾</div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Revolutionize Your Veterinary Practice with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Automate scheduling, documentation, and more—focus on what matters: pet health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onWatchDemo}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Watch Demo
            </button>
            <Link
              href="/features"
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 rounded-lg overflow-hidden shadow-lg">
          <img src="/veterinarian-with-happy-pets-in-clinic.jpg" alt="Veterinarian with happy pets" className="w-full h-auto" />
        </div>
      </div>
    </section>
  )
}

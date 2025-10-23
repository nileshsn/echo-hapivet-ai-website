"use client"

import type React from "react"

import { useState } from "react"
import toast from "react-hot-toast"

export default function FooterCTA() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Thanks for signing up!")
    setEmail("")
    setLoading(false)
  }

  return (
    <section className="py-16 md:py-24 bg-primary text-white">
      <div className="container max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Practice?</h2>
        <p className="text-lg mb-8 text-blue-100">
          Join veterinary clinics already using Hapivet to save time and improve care.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? "Sending..." : "Get Started Free"}
          </button>
        </form>
      </div>
    </section>
  )
}

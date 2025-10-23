import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Hapivet - AI Veterinary Practice Management",
  description:
    "Revolutionize your veterinary practice with AI-powered scheduling, documentation, and clinic automation.",
  keywords: "veterinary software, AI scheduling, SOAP notes, clinic management",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-background text-foreground`}>{children}</body>
    </html>
  )
}

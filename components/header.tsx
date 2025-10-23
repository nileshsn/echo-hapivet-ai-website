"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Voice Intake", href: "/voice-intake" },
    { label: "Voice Diagnosis", href: "/voice-diagnosis" },
    { label: "Smart Scheduling", href: "/smart-scheduling" },
    { label: "About", href: "/about" },
    { label: "Demo", href: "/demo" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">✨</div>
          <span className="text-xl font-bold text-foreground">Hapivet</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Login</button>
          <button className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium">
            Sign Up Free
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-secondary">
          <nav className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Login</button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium w-full">
                Sign Up Free
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

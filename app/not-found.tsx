import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Pet Not Found!</h1>
        <p className="text-muted-foreground mb-8">Looks like this page wandered off. Let's get you back home.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  )
}

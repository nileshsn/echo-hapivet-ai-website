import { CheckCircle } from "lucide-react"

export default function AdditionalFeatures() {
  const features = [
    "Multi-location clinic management",
    "Inventory tracking and alerts",
    "Automated billing and invoicing",
    "Patient history and records",
    "Prescription management",
    "Staff scheduling and payroll",
  ]

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground mb-8">Additional Features</h2>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 bg-secondary border border-border rounded-lg flex items-center justify-between"
            >
              <span className="text-foreground font-medium">{feature}</span>
              <CheckCircle className="text-green-600" size={20} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

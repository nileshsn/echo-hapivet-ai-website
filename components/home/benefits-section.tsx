import { Calendar, FileText, Cog } from "lucide-react"

export default function BenefitsSection() {
  const benefits = [
    {
      icon: Calendar,
      title: "Efficient Scheduling",
      description: "AI predicts and books appointments with voice input.",
    },
    {
      icon: FileText,
      title: "Smart Documentation",
      description: "Voice-to-SOAP conversion for instant diagnosis summaries.",
    },
    {
      icon: Cog,
      title: "Clinic-Wide Automation",
      description: "Manage multi-locations, inventory, and workflows seamlessly.",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Why Choose Hapivet?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="bg-background p-8 rounded-lg border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-primary" size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

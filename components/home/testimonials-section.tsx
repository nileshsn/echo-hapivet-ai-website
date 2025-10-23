export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Hapivet saved us 3 hours a day! Our team can now focus on patient care.",
      author: "Dr. Sarah Johnson",
      role: "Veterinary Clinic Owner",
      avatar: "👩‍⚕️",
    },
    {
      quote: "The voice-to-SOAP conversion is a game-changer. Documentation is now effortless.",
      author: "Dr. Michael Chen",
      role: "Senior Veterinarian",
      avatar: "👨‍⚕️",
    },
    {
      quote: "Best investment we made for our clinic. Highly recommend to all vets!",
      author: "Dr. Emily Rodriguez",
      role: "Multi-Location Clinic Manager",
      avatar: "👩‍⚕️",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">What Vets Are Saying</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-secondary p-8 rounded-lg border border-border">
              <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function TeamSection() {
  const team = [
    { name: "Dr. Sarah Johnson", role: "Co-Founder & CEO", avatar: "👩‍⚕️" },
    { name: "Michael Chen", role: "Co-Founder & CTO", avatar: "👨‍💻" },
    { name: "Dr. Emily Rodriguez", role: "Head of Product", avatar: "👩‍⚕️" },
  ]

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="text-center p-6 bg-secondary rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <div className="text-6xl mb-4">{member.avatar}</div>
              <h3 className="font-bold text-foreground mb-1">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

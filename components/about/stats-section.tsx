export default function StatsSection() {
  const stats = [
    { label: "Clinics Using Hapivet", value: "500+" },
    { label: "Hours Saved Monthly", value: "50K+" },
    { label: "Patients Managed", value: "2M+" },
  ]

  return (
    <section className="py-16 md:py-24 bg-primary text-white">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <p className="text-blue-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

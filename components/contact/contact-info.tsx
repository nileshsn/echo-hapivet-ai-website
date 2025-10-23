import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactInfo() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-8">Contact Information</h2>

      <div className="space-y-8">
        <div className="flex gap-4">
          <Mail className="text-primary flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Email</h3>
            <p className="text-muted-foreground">hello@hapivet.ai</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Phone className="text-primary flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Phone</h3>
            <p className="text-muted-foreground">+1 (555) 123-4567</p>
          </div>
        </div>

        <div className="flex gap-4">
          <MapPin className="text-primary flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Address</h3>
            <p className="text-muted-foreground">
              123 Veterinary Lane
              <br />
              San Francisco, CA 94105
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

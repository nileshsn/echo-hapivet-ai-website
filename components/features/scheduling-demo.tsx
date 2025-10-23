"use client"

import { useState } from "react"
import { Mic, Calendar } from "lucide-react"
import toast from "react-hot-toast"

export default function SchedulingDemo() {
  const [symptoms, setSymptoms] = useState("")
  const [scheduled, setScheduled] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const handleVoiceInput = () => {
    setIsListening(true)
    // Simulate voice input
    setTimeout(() => {
      setSymptoms("My dog has a fever and is not eating")
      setIsListening(false)
      toast.success("Voice input captured!")
    }, 2000)
  }

  const handleSchedule = () => {
    if (!symptoms.trim()) {
      toast.error("Please enter symptoms first")
      return
    }
    setScheduled(true)
    toast.success("Appointment scheduled!")
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">Patient Intake & Smart Scheduling</h2>
          <p className="text-muted-foreground mb-8">
            Use voice or text for pet symptom intake. AI analyzes urgency, predicts optimal slots based on past data,
            and auto-schedules.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-secondary p-8 rounded-lg border border-border">
              <h3 className="font-bold text-foreground mb-4">Enter Symptoms</h3>
              <div className="space-y-4">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your pet's symptoms..."
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleVoiceInput}
                    disabled={isListening}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Mic size={18} />
                    {isListening ? "Listening..." : "Voice Input"}
                  </button>
                  <button
                    onClick={handleSchedule}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Calendar size={18} />
                    Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-secondary p-8 rounded-lg border border-border">
              <h3 className="font-bold text-foreground mb-4">Scheduled Appointment</h3>
              {scheduled ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-semibold">✓ Appointment Confirmed</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-foreground">Date:</span>{" "}
                      <span className="text-muted-foreground">Oct 25, 2025</span>
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Time:</span>{" "}
                      <span className="text-muted-foreground">2:00 PM</span>
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Urgency:</span>{" "}
                      <span className="text-red-600 font-semibold">High</span>
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Vet:</span>{" "}
                      <span className="text-muted-foreground">Dr. Sarah Johnson</span>
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                    ⚠️ High urgency detected - prioritized for early slot
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Schedule an appointment to see details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import toast from "react-hot-toast"

export default function WorkflowSimulator() {
  const [step, setStep] = useState(0)
  const [symptoms, setSymptoms] = useState("")
  const [dictation, setDictation] = useState("")
  const [completed, setCompleted] = useState(false)

  const steps = [
    {
      title: "Step 1: Patient Intake",
      description: "Enter pet symptoms for scheduling",
    },
    {
      title: "Step 2: Smart Scheduling",
      description: "AI schedules optimal appointment slot",
    },
    {
      title: "Step 3: Diagnosis Dictation",
      description: "Vet dictates diagnosis notes",
    },
    {
      title: "Step 4: SOAP Generation",
      description: "AI converts to structured SOAP notes",
    },
  ]

  const handleNextStep = () => {
    if (step === 0 && !symptoms.trim()) {
      toast.error("Please enter symptoms")
      return
    }
    if (step === 2 && !dictation.trim()) {
      toast.error("Please enter dictation")
      return
    }

    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      setCompleted(true)
      toast.success("Workflow completed!")
    }
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Full Workflow Simulator</h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                  index <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-secondary p-8 rounded-lg border border-border mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">{steps[step].title}</h3>
          <p className="text-muted-foreground mb-6">{steps[step].description}</p>

          {step === 0 && (
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Enter pet symptoms..."
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              rows={4}
            />
          )}

          {step === 1 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">✓ Appointment Scheduled</p>
              <p className="text-green-700 text-sm">Oct 25, 2025 at 2:00 PM with Dr. Sarah Johnson</p>
            </div>
          )}

          {step === 2 && (
            <textarea
              value={dictation}
              onChange={(e) => setDictation(e.target.value)}
              placeholder="Dictate diagnosis notes..."
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              rows={4}
            />
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Subjective:</p>
                <p className="text-muted-foreground">{dictation.split(".")[0]}.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Objective:</p>
                <p className="text-muted-foreground">Temperature normal. Lungs clear.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Assessment:</p>
                <p className="text-muted-foreground">Diagnosis confirmed. Treatment plan initiated.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Plan:</p>
                <p className="text-muted-foreground">Prescribe medication. Follow-up in 3 days.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!completed ? (
          <div className="flex gap-4">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex-1 px-4 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {step === steps.length - 1 ? "Complete" : "Next"}
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
            <p className="text-green-800 font-bold text-lg mb-2">✓ Workflow Complete!</p>
            <p className="text-green-700">Appointment booked and notes saved successfully.</p>
            <button
              onClick={() => {
                setStep(0)
                setSymptoms("")
                setDictation("")
                setCompleted(false)
              }}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

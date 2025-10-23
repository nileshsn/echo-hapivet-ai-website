"use client"

import { useState } from "react"
import { Mic, AlertCircle, FileText } from "lucide-react"
import toast from "react-hot-toast"

export default function DiagnosisDemo() {
  const [dictation, setDictation] = useState("")
  const [soapNotes, setSoapNotes] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)

  const handleVoiceDictation = () => {
    setIsListening(true)
    // Simulate voice input
    setTimeout(() => {
      setDictation(
        "Patient presents with persistent cough for 3 days. Temperature 102.5F. Lungs clear on auscultation. No discharge from eyes or nose. Owner reports decreased appetite.",
      )
      setIsListening(false)
      toast.success("Dictation captured!")
    }, 2000)
  }

  const handleGenerateSOAP = () => {
    if (!dictation.trim()) {
      toast.error("Please enter dictation first")
      return
    }

    // Simulate AI parsing
    setSoapNotes({
      subjective: "Patient presents with persistent cough for 3 days. Owner reports decreased appetite.",
      objective: "Temperature 102.5F. Lungs clear on auscultation. No discharge from eyes or nose.",
      assessment: "Possible upper respiratory infection or early pneumonia. Fever present.",
      plan: "Prescribe antibiotics. Recommend rest and hydration. Follow-up in 3 days.",
      alerts: ["Potential allergy conflict detected with previous penicillin sensitivity"],
    })
    toast.success("SOAP notes generated!")
  }

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">Real-Time Diagnosis Documentation</h2>
          <p className="text-muted-foreground mb-8">
            Vets dictate notes via voice; AI converts to structured SOAP notes, summarizes, and checks for
            inconsistencies with patient history.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-background p-8 rounded-lg border border-border">
              <h3 className="font-bold text-foreground mb-4">Dictate Diagnosis</h3>
              <div className="space-y-4">
                <textarea
                  value={dictation}
                  onChange={(e) => setDictation(e.target.value)}
                  placeholder="Dictate your diagnosis notes..."
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  rows={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleVoiceDictation}
                    disabled={isListening}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Mic size={18} />
                    {isListening ? "Listening..." : "Voice Dictation"}
                  </button>
                  <button
                    onClick={handleGenerateSOAP}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Generate SOAP
                  </button>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-background p-8 rounded-lg border border-border">
              <h3 className="font-bold text-foreground mb-4">SOAP Notes</h3>
              {soapNotes ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Subjective:</p>
                    <p className="text-muted-foreground">{soapNotes.subjective}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Objective:</p>
                    <p className="text-muted-foreground">{soapNotes.objective}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Assessment:</p>
                    <p className="text-muted-foreground">{soapNotes.assessment}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Plan:</p>
                    <p className="text-muted-foreground">{soapNotes.plan}</p>
                  </div>
                  {soapNotes.alerts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2">
                      <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800 text-xs">Alert</p>
                        <p className="text-red-700 text-xs">{soapNotes.alerts[0]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Generate SOAP notes to see structured output</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

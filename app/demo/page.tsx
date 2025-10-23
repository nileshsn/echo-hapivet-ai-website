"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import DemoIntro from "@/components/demo/demo-intro"
import WorkflowSimulator from "@/components/demo/workflow-simulator"

export default function DemoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <DemoIntro />
        <WorkflowSimulator />
      </main>
      <Footer />
    </div>
  )
}

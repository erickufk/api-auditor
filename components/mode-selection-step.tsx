"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TestMode } from "@/lib/types"

interface ModeSelectionStepProps {
  onNext: (mode: TestMode) => void
  onBack: () => void
}

export function ModeSelectionStep({ onNext, onBack }: ModeSelectionStepProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Select Testing Mode</h2>
        <p className="text-pretty text-muted-foreground">Choose how you want to test your API</p>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card
          className="group cursor-pointer border-2 p-8 transition-all hover:border-primary"
          onClick={() => onNext("agentic")}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <span className="text-4xl">⚡</span>
          </div>
          <h3 className="mb-3 text-2xl font-semibold text-foreground">Agentic Mode</h3>
          <p className="mb-4 text-pretty text-muted-foreground">
            Let the AI agent autonomously explore and test your API. Upload an OpenAPI specification or provide a
            starting endpoint.
          </p>
          <ul className="mb-6 space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>Autonomous endpoint discovery</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>Iterative security testing</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>Comprehensive vulnerability scanning</span>
            </li>
          </ul>
          <Button className="w-full">Select Agentic Mode</Button>
        </Card>

        <Card
          className="group cursor-pointer border-2 p-8 transition-all hover:border-primary"
          onClick={() => onNext("manual")}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="mb-3 text-2xl font-semibold text-foreground">Manual Mode</h3>
          <p className="mb-4 text-pretty text-muted-foreground">
            Test a specific endpoint with full control over the request parameters, headers, and body.
          </p>
          <ul className="mb-6 space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-accent">•</span>
              <span>Precise endpoint testing</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-accent">•</span>
              <span>Full request customization</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-accent">•</span>
              <span>Single request analysis</span>
            </li>
          </ul>
          <Button variant="outline" className="w-full bg-transparent">
            Select Manual Mode
          </Button>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={onBack} variant="ghost">
          <span className="mr-2">←</span>
          Back to Project Setup
        </Button>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectMetadata } from "@/lib/types"

interface ProjectSetupStepProps {
  onNext: (metadata: ProjectMetadata) => void
  onBack: () => void
  initialData?: ProjectMetadata
}

export function ProjectSetupStep({ onNext, onBack, initialData }: ProjectSetupStepProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onNext({ name: name.trim(), description: description.trim() })
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-4xl">📄</span>
          </div>
        </div>
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Project Setup</h2>
        <p className="text-pretty text-muted-foreground">
          Provide details about your project. This information will appear in your security report.
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., Payment API, User Management Service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">A descriptive name for your API or service</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <Textarea
              id="project-description"
              placeholder="e.g., RESTful API for processing payments and managing transactions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Optional: Brief description of what your API does</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              <span className="mr-2">←</span>
              Back
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1">
              Continue
              <span className="ml-2">→</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

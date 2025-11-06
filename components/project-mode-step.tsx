"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectMetadata, TestMode } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"

interface ProjectModeStepProps {
  onNext: (metadata: ProjectMetadata, mode: TestMode) => void
  onBack: () => void
  initialMetadata?: ProjectMetadata
  initialMode?: TestMode
}

export function ProjectModeStep({ onNext, onBack, initialMetadata, initialMode }: ProjectModeStepProps) {
  const { t } = useLanguage()
  const [name, setName] = useState(initialMetadata?.name || "")
  const [description, setDescription] = useState(initialMetadata?.description || "")
  const [selectedMode, setSelectedMode] = useState<TestMode | null>(initialMode || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && selectedMode) {
      onNext({ name: name.trim(), description: description.trim() }, selectedMode)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-4xl">📄</span>
          </div>
        </div>
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">{t("projectSetup")}</h2>
        <p className="text-pretty text-muted-foreground">{t("selectMode")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">{t("projectSetup")}</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                {t("projectName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder={t("projectNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">{t("projectDescription")}</Label>
              <Textarea
                id="project-description"
                placeholder={t("projectDescPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Card>

        <div>
          <h3 className="mb-4 text-lg font-semibold">{t("selectMode")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className={`group cursor-pointer border-2 p-6 transition-all hover:border-primary ${
                selectedMode === "agentic" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedMode("agentic")}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <span className="text-3xl">⚡</span>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-foreground">{t("agenticMode")}</h4>
              <p className="text-sm text-muted-foreground">{t("agenticModeFullDesc")}</p>
            </Card>

            <Card
              className={`group cursor-pointer border-2 p-6 transition-all hover:border-accent ${
                selectedMode === "manual" ? "border-accent bg-accent/5" : ""
              }`}
              onClick={() => setSelectedMode("manual")}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-foreground">{t("manualMode")}</h4>
              <p className="text-sm text-muted-foreground">{t("manualModeFullDesc")}</p>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onBack} variant="outline" className="flex-1 bg-transparent">
            <span className="mr-2">←</span>
            {t("back")}
          </Button>
          <Button type="submit" disabled={!name.trim() || !selectedMode} className="flex-1">
            {t("next")}
            <span className="ml-2">→</span>
          </Button>
        </div>
      </form>
    </div>
  )
}

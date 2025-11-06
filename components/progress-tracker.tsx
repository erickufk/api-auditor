"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Stage } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"

interface ProgressTrackerProps {
  stages: Stage[]
  currentStage: number
  error?: string
  onStop?: () => void
}

export function ProgressTracker({ stages, currentStage, error, onStop }: ProgressTrackerProps) {
  const { t } = useLanguage()
  const completedStages = stages.filter((s) => s.status === "complete").length
  const progressPercentage = (completedStages / stages.length) * 100
  const isRunning = stages.some((s) => s.status === "in-progress")

  const getStageIcon = (stage: Stage, index: number) => {
    if (stage.status === "complete") {
      return <span className="text-2xl text-success">✓</span>
    }
    if (stage.status === "error") {
      return <span className="text-2xl text-destructive">✗</span>
    }
    if (stage.status === "in-progress") {
      return <span className="text-2xl animate-spin text-primary">⟳</span>
    }
    return <span className="text-2xl text-muted-foreground">○</span>
  }

  const getStageStatus = (stage: Stage) => {
    switch (stage.status) {
      case "complete":
        return t("completed")
      case "in-progress":
        return t("running")
      case "error":
        return t("failed")
      default:
        return t("pending")
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Security Audit in Progress</h2>
        <p className="text-pretty text-muted-foreground">
          Analyzing your API specification for security vulnerabilities
        </p>
      </div>

      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold text-foreground">
              {completedStages} of {stages.length} stages complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-3" />

        {isRunning && onStop && (
          <div className="mt-4 flex justify-center">
            <Button variant="destructive" size="lg" onClick={onStop} className="gap-2">
              <span className="text-lg">⏹</span>
              {t("stopTesting")}
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <Card className="mb-6 border-destructive bg-destructive/5 p-4">
          <div className="flex gap-3">
            <span className="text-xl shrink-0 text-destructive">⚠️</span>
            <div>
              <p className="font-medium text-destructive">
                {error === "Testing stopped by user" ? t("testingStopped") : "Error occurred during analysis"}
              </p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isActive = index === currentStage
          const isPast = index < currentStage

          return (
            <Card
              key={stage.id}
              className={`p-6 transition-all ${
                isActive ? "border-primary bg-primary/5 shadow-md" : isPast ? "bg-muted/30" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0">{getStageIcon(stage, index)}</div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{stage.name}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        stage.status === "complete"
                          ? "bg-success/10 text-success"
                          : stage.status === "in-progress"
                            ? "bg-primary/10 text-primary"
                            : stage.status === "error"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getStageStatus(stage)}
                    </span>
                  </div>

                  {stage.description && <p className="text-sm text-muted-foreground">{stage.description}</p>}

                  {stage.status === "in-progress" && (
                    <div className="mt-3">
                      <Progress value={undefined} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-sm font-medium text-muted-foreground">
                    Stage {index + 1}/{stages.length}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          This process may take a few minutes depending on the size of your API specification
        </p>
      </div>
    </div>
  )
}

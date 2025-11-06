"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-5xl">🛡️</span>
          </div>
        </div>
        <h1 className="mb-4 text-balance text-4xl font-bold text-foreground">{t("welcomeTitle")}</h1>
        <p className="text-pretty text-lg text-muted-foreground">{t("welcomeSubtitle")}</p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-3xl">⚡</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("agenticModeTitle")}</h3>
          <p className="text-pretty text-sm text-muted-foreground">{t("agenticModeDesc")}</p>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("manualModeTitle")}</h3>
          <p className="text-pretty text-sm text-muted-foreground">{t("manualModeDesc")}</p>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("reportsTitle")}</h3>
          <p className="text-pretty text-sm text-muted-foreground">{t("reportsDesc")}</p>
        </Card>
      </div>

      <Card className="border-accent/50 bg-accent/5 p-8">
        <h3 className="mb-4 text-xl font-semibold text-foreground">{t("whatYouGetTitle")}</h3>
        <ul className="mb-6 space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              ✓
            </div>
            <span className="text-sm text-muted-foreground">{t("feature1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              ✓
            </div>
            <span className="text-sm text-muted-foreground">{t("feature2")}</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              ✓
            </div>
            <span className="text-sm text-muted-foreground">{t("feature3")}</span>
          </li>
        </ul>

        <Button onClick={onNext} size="lg" className="w-full">
          {t("getStarted")}
          <span className="ml-2">→</span>
        </Button>
      </Card>
    </div>
  )
}

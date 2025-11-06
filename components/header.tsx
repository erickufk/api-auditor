"use client"

import { LanguageToggle } from "./language-toggle"
import { useLanguage } from "@/lib/language-context"

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl">🛡️</div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t("appTitle")}</h1>
              <p className="text-sm text-muted-foreground">{t("appSubtitle")}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AgenticConfig } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"

interface AgenticSettingsProps {
  config: AgenticConfig
  onChange: (config: AgenticConfig) => void
  disabled?: boolean
}

export function AgenticSettings({ config, onChange, disabled }: AgenticSettingsProps) {
  const { t } = useLanguage()

  return (
    <Card className="border-amber-500/20 bg-amber-500/5 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">⚡</span>
        <Label className="text-base font-semibold">{t("agenticSettings")}</Label>
      </div>

      <div className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="agentic-enabled">{t("enableAgenticMode")}</Label>
            <p className="text-xs text-muted-foreground">{t("enableAgenticModeDesc")}</p>
          </div>
          <Switch
            id="agentic-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
            disabled={disabled}
          />
        </div>

        {config.enabled && (
          <>
            {/* Max Iterations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-iterations">
                  {t("maxIterations")}: {config.maxIterations}
                </Label>
              </div>
              <Slider
                id="max-iterations"
                min={3}
                max={15}
                step={1}
                value={[config.maxIterations]}
                onValueChange={([value]) => onChange({ ...config, maxIterations: value })}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t("iterationsDesc")}</p>
            </div>

            {/* Stop on Vulnerability */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stop-on-vuln">{t("stopOnVuln")}</Label>
                <p className="text-xs text-muted-foreground">{t("stopOnVulnDesc")}</p>
              </div>
              <Switch
                id="stop-on-vuln"
                checked={config.stopOnVulnerability}
                onCheckedChange={(stopOnVulnerability) => onChange({ ...config, stopOnVulnerability })}
                disabled={disabled}
              />
            </div>

            {/* Aggressiveness Level */}
            <div className="space-y-2">
              <Label htmlFor="aggressiveness">{t("aggressiveness")}</Label>
              <Select
                value={config.aggressiveness}
                onValueChange={(aggressiveness: "low" | "medium" | "high") => onChange({ ...config, aggressiveness })}
                disabled={disabled}
              >
                <SelectTrigger id="aggressiveness">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("aggressivenessLow")}</SelectItem>
                  <SelectItem value="medium">{t("aggressivenessMedium")}</SelectItem>
                  <SelectItem value="high">{t("aggressivenessHigh")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("aggressivenessDesc")}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-fuzzing">{t("enableFuzzing")}</Label>
                <p className="text-xs text-muted-foreground">{t("enableFuzzingDesc")}</p>
              </div>
              <Switch
                id="enable-fuzzing"
                checked={config.enableFuzzing}
                onCheckedChange={(enableFuzzing) => onChange({ ...config, enableFuzzing })}
                disabled={disabled}
              />
            </div>

            {config.enableFuzzing && (
              <div className="space-y-2">
                <Label htmlFor="fuzzing-intensity">{t("fuzzingIntensity")}</Label>
                <Select
                  value={config.fuzzingIntensity}
                  onValueChange={(fuzzingIntensity: "low" | "medium" | "high") =>
                    onChange({ ...config, fuzzingIntensity })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger id="fuzzing-intensity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("fuzzingLow")}</SelectItem>
                    <SelectItem value="medium">{t("fuzzingMedium")}</SelectItem>
                    <SelectItem value="high">{t("fuzzingHigh")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("fuzzingIntensityDesc")}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-open-doors">{t("enableOpenDoors")}</Label>
                <p className="text-xs text-muted-foreground">{t("enableOpenDoorsDesc")}</p>
              </div>
              <Switch
                id="enable-open-doors"
                checked={config.enableOpenDoorsDetection}
                onCheckedChange={(enableOpenDoorsDetection) => onChange({ ...config, enableOpenDoorsDetection })}
                disabled={disabled}
              />
            </div>

            {/* Warning */}
            <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="mt-0.5 shrink-0 text-amber-500">⚠️</span>
              <p className="text-xs text-muted-foreground">{t("agenticWarning")}</p>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

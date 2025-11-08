"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-background">
      <div className="relative z-10 space-y-24 py-12 px-6 max-w-[1320px] mx-auto">
        {/* Hero Section */}
        <div className="pt-8">
          <section className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-primary text-sm font-medium">
              <span className="text-xl">✨</span>
              {t("landingBadge")}
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-balance leading-tight">
              {t("landingHeroTitle")}
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t("landingHeroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {t("getStarted")}
                <span className="ml-2">→</span>
              </Button>
            </div>
          </section>
        </div>

        {/* Features Grid */}
        <div>
          <section className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🛡️", title: t("landingFeature1Title"), desc: t("landingFeature1Desc") },
              { icon: "⚡", title: t("landingFeature2Title"), desc: t("landingFeature2Desc") },
              { icon: "📄", title: t("landingFeature3Title"), desc: t("landingFeature3Desc") },
            ].map((feature, i) => (
              <div key={i}>
                <Card className="p-8 space-y-4 glass-card hover:border-primary/50 transition-all duration-300 h-full">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </Card>
              </div>
            ))}
          </section>
        </div>

        {/* Testing Modes Comparison */}
        <div>
          <section className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-5xl font-semibold tracking-tight">{t("landingModesTitle")}</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">{t("landingModesSubtitle")}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Agentic Mode */}
              <div>
                <Card className="p-10 space-y-8 glass-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent h-full">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-4xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="text-3xl font-semibold mb-3">{t("agenticMode")}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t("landingAgenticDesc")}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      t("landingAgenticFeature1"),
                      t("landingAgenticFeature2"),
                      t("landingAgenticFeature3"),
                      t("landingAgenticFeature4"),
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-primary mt-1 flex-shrink-0">✓</span>
                        <p className="leading-relaxed">{feature}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t("landingBestFor")}</p>
                    <p className="leading-relaxed">{t("landingAgenticBestFor")}</p>
                  </div>
                </Card>
              </div>

              {/* Manual Mode */}
              <div>
                <Card className="p-10 space-y-8 glass-card border-accent/30 bg-gradient-to-br from-accent/10 to-transparent h-full">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0 text-4xl">
                      ✋
                    </div>
                    <div>
                      <h3 className="text-3xl font-semibold mb-3">{t("manualMode")}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t("landingManualDesc")}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      t("landingManualFeature1"),
                      t("landingManualFeature2"),
                      t("landingManualFeature3"),
                      t("landingManualFeature4"),
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-accent mt-1 flex-shrink-0">✓</span>
                        <p className="leading-relaxed">{feature}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t("landingBestFor")}</p>
                    <p className="leading-relaxed">{t("landingManualBestFor")}</p>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </div>

        {/* Approach Section */}
        <div>
          <section className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-5xl font-semibold tracking-tight">{t("landingApproachTitle")}</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">{t("landingApproachSubtitle")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "🎯", title: t("landingApproach1Title"), desc: t("landingApproach1Desc") },
                { icon: "🤖", title: t("landingApproach2Title"), desc: t("landingApproach2Desc") },
                { icon: "🛡️", title: t("landingApproach3Title"), desc: t("landingApproach3Desc") },
                { icon: "📄", title: t("landingApproach4Title"), desc: t("landingApproach4Desc") },
              ].map((approach, i) => (
                <div key={i}>
                  <Card className="p-8 space-y-4 glass-card hover:border-primary/50 transition-all duration-300 h-full">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                        {approach.icon}
                      </div>
                      <h3 className="text-xl font-semibold">{approach.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{approach.desc}</p>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div>
          <section className="max-w-4xl mx-auto text-center space-y-8 py-16">
            <h2 className="text-5xl font-semibold tracking-tight">{t("landingCtaTitle")}</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">{t("landingCtaSubtitle")}</p>
            <Button
              size="lg"
              onClick={onGetStarted}
              className="text-lg px-8 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {t("getStarted")}
              <span className="ml-2">→</span>
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}

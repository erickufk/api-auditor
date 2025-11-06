"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { LandingPage } from "@/components/landing-page"
import { WelcomeStep } from "@/components/welcome-step"
import { ProjectModeStep } from "@/components/project-mode-step"
import { AuthConfigStep } from "@/components/auth-config-step"
import { AgenticConfigStep } from "@/components/agentic-config-step"
import { ManualConfigStep } from "@/components/manual-config-step"
import { ProgressTracker } from "@/components/progress-tracker"
import { ReportDisplay } from "@/components/report-display"
import { useLanguage } from "@/lib/language-context"
import type {
  ProjectMetadata,
  AuthConfig,
  TestMode,
  AuditSession,
  ManualTestRequest,
  ManualTestResponse,
  ManualTestData,
  AgenticConfig,
  Vulnerability,
  AgenticTestResult,
  SecurityReport,
  SeverityLevel,
  ParsedOpenAPISpec,
} from "@/lib/types"
import { MANUAL_TEST_STAGES } from "@/lib/stages-config"
import { runSecurityAudit } from "@/lib/ai-workflow"
import { analyzeManualTest } from "@/lib/manual-test-workflow"
import { sessionStorage } from "@/lib/session-storage"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { runAgenticWorkflow as executeAgenticWorkflow } from "@/lib/agentic-workflow"
import { parseOpenAPISpec, buildEndpointUrl } from "@/lib/openapi-parser"

type WizardStep = "landing" | "welcome" | "project-mode" | "auth" | "config" | "running" | "results"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("landing")
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null)
  const [selectedMode, setSelectedMode] = useState<TestMode | null>(null)
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null)
  const [session, setSession] = useState<AuditSession | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const savedMetadata = sessionStorage.getProjectMetadata()
    const savedMode = sessionStorage.getTestMode()
    const savedAuth = sessionStorage.getAuthConfig()

    if (savedMetadata) setProjectMetadata(savedMetadata)
    if (savedMode) setSelectedMode(savedMode)
    if (savedAuth) setAuthConfig(savedAuth)
  }, [])

  const handleWelcomeNext = () => {
    console.log("[v0] Welcome step completed")
    setCurrentStep("project-mode")
  }

  const handleProjectModeNext = (metadata: ProjectMetadata, mode: TestMode) => {
    console.log("[v0] Project mode step completed:", { metadata, mode })
    setProjectMetadata(metadata)
    setSelectedMode(mode)
    sessionStorage.saveProjectMetadata(metadata)
    sessionStorage.saveTestMode(mode)
    setCurrentStep("auth")
  }

  const handleAuthNext = (auth: AuthConfig) => {
    console.log("[v0] Auth step completed:", auth)
    setAuthConfig(auth)
    sessionStorage.saveAuthConfig(auth)
    setCurrentStep("config")
  }

  const handleAgenticConfigNext = async (data: {
    inputType: "file" | "manual"
    fileContent?: string
    fileName?: string
    endpoint?: string
    method?: string
    headers?: Record<string, string>
    queryParams?: Record<string, string>
    body?: string
    agenticConfig: AgenticConfig
  }) => {
    console.log("[v0] Agentic config step completed:", data)
    sessionStorage.saveAgenticConfig(data.agenticConfig)
    setCurrentStep("running")

    abortControllerRef.current = new AbortController()

    if (data.inputType === "file" && data.fileContent && data.fileName) {
      console.log("[v0] Starting agentic workflow for OpenAPI file")

      try {
        const parsedSpec = parseOpenAPISpec(data.fileContent)
        console.log("[v0] Parsed OpenAPI spec:", parsedSpec)

        const newSession: AuditSession = {
          workflowType: "agentic",
          projectMetadata: projectMetadata!,
          testMode: selectedMode!,
          authConfig: authConfig!,
          fileName: data.fileName,
          fileContent: data.fileContent,
          currentStage: 0,
          stages: MANUAL_TEST_STAGES.map((stage) => ({ ...stage, status: "pending" })),
        }

        setSession(newSession)
        await runAgenticWorkflowForFile(newSession, parsedSpec, data.agenticConfig)
      } catch (error) {
        console.error("[v0] Failed to parse OpenAPI file:", error)
        toast({
          title: "Error",
          description: "Failed to parse OpenAPI specification",
          variant: "destructive",
        })
        setCurrentStep("config")
      }
    } else if (data.inputType === "manual" && data.endpoint) {
      console.log("[v0] Starting agentic workflow for single endpoint")

      const initialRequest: ManualTestRequest = {
        url: data.endpoint,
        method: (data.method as any) || "GET",
        headers: data.headers || {},
        queryParams: data.queryParams,
        body: data.body,
      }

      if (authConfig && authConfig.method !== "none") {
        if (authConfig.method === "bearer" && authConfig.token) {
          initialRequest.headers["Authorization"] = `Bearer ${authConfig.token}`
        } else if (authConfig.method === "api-key" && authConfig.apiKey) {
          if (authConfig.apiKeyLocation === "header") {
            initialRequest.headers[authConfig.apiKeyName || "X-API-Key"] = authConfig.apiKey
          }
        } else if (authConfig.method === "basic" && authConfig.username && authConfig.password) {
          const credentials = btoa(`${authConfig.username}:${authConfig.password}`)
          initialRequest.headers["Authorization"] = `Basic ${credentials}`
        }
      }

      const newSession: AuditSession = {
        workflowType: "agentic",
        projectMetadata: projectMetadata!,
        testMode: selectedMode!,
        authConfig: authConfig!,
        currentStage: 0,
        stages: MANUAL_TEST_STAGES.map((stage) => ({ ...stage, status: "pending" })),
      }

      setSession(newSession)
      await runAgenticWorkflow(newSession, initialRequest, data.agenticConfig)
    } else {
      console.error("[v0] Invalid agentic config data:", data)
      toast({
        title: "Error",
        description: "Invalid configuration. Please check your inputs.",
        variant: "destructive",
      })
      setCurrentStep("config")
    }
  }

  const runAutomatedWorkflow = async (auditSession: AuditSession) => {
    console.log("[v0] Starting automated workflow")
    try {
      const report = await runSecurityAudit(auditSession, (stageIndex, status, error) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Test aborted by user")
        }

        console.log("[v0] Stage update:", { stageIndex, status, error })
        setSession((prev) => {
          if (!prev) return prev

          const updatedStages = [...prev.stages]
          updatedStages[stageIndex] = {
            ...updatedStages[stageIndex],
            status,
          }

          return {
            ...prev,
            currentStage: stageIndex,
            stages: updatedStages,
            error: error || prev.error,
          }
        })
      })

      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          report,
        }
      })

      setTimeout(() => {
        setCurrentStep("results")
        toast({
          title: "Success",
          description: "Security audit completed successfully",
        })
      }, 500)
    } catch (error) {
      if (error instanceof Error && error.message === "Test aborted by user") {
        console.log("[v0] Test was aborted by user")
        return
      }

      console.error("[v0] Audit workflow error:", error)
      toast({
        title: "Error",
        description: "Failed to complete security audit",
        variant: "destructive",
      })

      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }
      })
    }
  }

  const runAgenticWorkflow = async (
    auditSession: AuditSession,
    initialRequest: ManualTestRequest,
    agenticConfig: AgenticConfig,
  ) => {
    console.log("[v0] Starting agentic workflow with config:", agenticConfig)
    try {
      const result = await executeAgenticWorkflow(initialRequest, agenticConfig, (iteration, total, status) => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Test aborted by user")
        }

        console.log("[v0] Agentic iteration update:", { iteration, total, status })

        // Update progress display
        setSession((prev) => {
          if (!prev) return prev

          const updatedStages = [...prev.stages]
          // Update the current stage based on iteration
          const stageIndex = Math.min(1, Math.floor((iteration / total) * 2))
          updatedStages[stageIndex] = {
            ...updatedStages[stageIndex],
            status: "in-progress",
            description: `${status} (Iteration ${iteration + 1}/${total})`,
          }

          return {
            ...prev,
            currentStage: stageIndex,
            stages: updatedStages,
          }
        })
      })

      console.log("[v0] Agentic workflow completed:", result)

      // Convert agentic result to security report format
      const report: SecurityReport = {
        scan_id: `agentic-${Date.now()}`,
        timestamp: new Date().toISOString(),
        api_name: projectMetadata?.name || "API Security Test",
        overall_risk_score: calculateOverallRisk(result.totalVulnerabilities),
        endpoints_scanned: 1,
        vulnerabilities_found: result.totalVulnerabilities.length,
        vulnerabilities: result.totalVulnerabilities,
        summary: {
          critical: result.totalVulnerabilities.filter((v) => v.severity === "critical").length,
          high: result.totalVulnerabilities.filter((v) => v.severity === "high").length,
          medium: result.totalVulnerabilities.filter((v) => v.severity === "medium").length,
          low: result.totalVulnerabilities.filter((v) => v.severity === "low").length,
          info: result.totalVulnerabilities.filter((v) => v.severity === "info").length,
        },
        recommendations: generateRecommendations(result),
      }

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = prev.stages.map((s) => ({ ...s, status: "complete" as const }))
        return {
          ...prev,
          stages: updatedStages,
          report,
          agenticResult: result,
        }
      })

      setTimeout(() => {
        setCurrentStep("results")
        toast({
          title: "Success",
          description: "Agentic security test completed successfully",
        })
      }, 500)
    } catch (error) {
      if (error instanceof Error && error.message === "Test aborted by user") {
        console.log("[v0] Test was aborted by user")
        return
      }

      console.error("[v0] Agentic workflow error:", error)
      toast({
        title: "Error",
        description: "Failed to complete agentic test",
        variant: "destructive",
      })

      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }
      })
    }
  }

  const runAgenticWorkflowForFile = async (
    auditSession: AuditSession,
    parsedSpec: ParsedOpenAPISpec,
    agenticConfig: AgenticConfig,
  ) => {
    console.log("[v0] Starting agentic workflow for file with", parsedSpec.endpoints.length, "endpoints")

    try {
      const allResults: AgenticTestResult[] = []
      const allVulnerabilities: Vulnerability[] = []

      for (let i = 0; i < parsedSpec.endpoints.length; i++) {
        const endpoint = parsedSpec.endpoints[i]

        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Test aborted by user")
        }

        console.log(`[v0] Testing endpoint ${i + 1}/${parsedSpec.endpoints.length}:`, endpoint)

        // Build the request for this endpoint
        const url = buildEndpointUrl(parsedSpec.baseUrl || "", endpoint.path)
        const initialRequest: ManualTestRequest = {
          url,
          method: endpoint.method as any,
          headers: {},
        }

        // Add auth headers if configured
        if (authConfig && authConfig.method !== "none") {
          if (authConfig.method === "bearer" && authConfig.token) {
            initialRequest.headers["Authorization"] = `Bearer ${authConfig.token}`
          } else if (authConfig.method === "api-key" && authConfig.apiKey) {
            if (authConfig.apiKeyLocation === "header") {
              initialRequest.headers[authConfig.apiKeyName || "X-API-Key"] = authConfig.apiKey
            }
          } else if (authConfig.method === "basic" && authConfig.username && authConfig.password) {
            const credentials = btoa(`${authConfig.username}:${authConfig.password}`)
            initialRequest.headers["Authorization"] = `Basic ${credentials}`
          }
        }

        // Update progress
        setSession((prev) => {
          if (!prev) return prev
          const updatedStages = [...prev.stages]
          updatedStages[0] = {
            ...updatedStages[0],
            status: "in-progress",
            description: `Testing endpoint ${i + 1}/${parsedSpec.endpoints.length}: ${endpoint.method} ${endpoint.path}`,
          }
          return {
            ...prev,
            currentStage: 0,
            stages: updatedStages,
          }
        })

        // Run agentic workflow for this endpoint
        const result = await executeAgenticWorkflow(initialRequest, agenticConfig, (iteration, total, status) => {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Test aborted by user")
          }

          console.log(
            `[v0] Endpoint ${i + 1}/${parsedSpec.endpoints.length}, Iteration ${iteration + 1}/${total}:`,
            status,
          )

          setSession((prev) => {
            if (!prev) return prev
            const updatedStages = [...prev.stages]
            updatedStages[0] = {
              ...updatedStages[0],
              status: "in-progress",
              description: `Endpoint ${i + 1}/${parsedSpec.endpoints.length}: ${endpoint.method} ${endpoint.path} - ${status} (Iteration ${iteration + 1}/${total})`,
            }
            return {
              ...prev,
              currentStage: 0,
              stages: updatedStages,
            }
          })
        })

        console.log(`[v0] Completed testing endpoint ${i + 1}/${parsedSpec.endpoints.length}:`, result)
        allResults.push(result)
        allVulnerabilities.push(...result.totalVulnerabilities)

        // Add delay between endpoints to prevent rate limiting
        if (i < parsedSpec.endpoints.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      // Consolidate all results
      const consolidatedResult: AgenticTestResult = {
        iterations: allResults.flatMap((r) => r.iterations),
        totalVulnerabilities: allVulnerabilities,
        summary:
          `Agentic security audit completed for ${parsedSpec.endpoints.length} endpoints.\n\n` +
          `Total vulnerabilities found: ${allVulnerabilities.length}\n` +
          `- Critical: ${allVulnerabilities.filter((v) => v.severity === "critical").length}\n` +
          `- High: ${allVulnerabilities.filter((v) => v.severity === "high").length}\n` +
          `- Medium: ${allVulnerabilities.filter((v) => v.severity === "medium").length}\n` +
          `- Low: ${allVulnerabilities.filter((v) => v.severity === "low").length}\n\n` +
          `The AI agent autonomously tested ${parsedSpec.endpoints.length} endpoints with ${allResults.reduce((sum, r) => sum + r.iterations.length, 0)} total iterations.`,
        stoppedReason: "no_more_tests",
        endpointResults: allResults.map((result, index) => ({
          endpoint: parsedSpec.endpoints[index],
          result,
        })),
      }

      // Convert to security report format
      const report: SecurityReport = {
        scan_id: `agentic-file-${Date.now()}`,
        timestamp: new Date().toISOString(),
        api_name: parsedSpec.title,
        overall_risk_score: calculateOverallRisk(allVulnerabilities),
        endpoints_scanned: parsedSpec.endpoints.length,
        vulnerabilities_found: allVulnerabilities.length,
        vulnerabilities: allVulnerabilities,
        summary: {
          critical: allVulnerabilities.filter((v) => v.severity === "critical").length,
          high: allVulnerabilities.filter((v) => v.severity === "high").length,
          medium: allVulnerabilities.filter((v) => v.severity === "medium").length,
          low: allVulnerabilities.filter((v) => v.severity === "low").length,
          info: allVulnerabilities.filter((v) => v.severity === "info").length,
        },
        recommendations: generateRecommendations(consolidatedResult),
      }

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = prev.stages.map((s) => ({ ...s, status: "complete" as const }))
        return {
          ...prev,
          stages: updatedStages,
          report,
          agenticResult: consolidatedResult,
        }
      })

      setTimeout(() => {
        setCurrentStep("results")
        toast({
          title: "Success",
          description: `Agentic security test completed for ${parsedSpec.endpoints.length} endpoints`,
        })
      }, 500)
    } catch (error) {
      if (error instanceof Error && error.message === "Test aborted by user") {
        console.log("[v0] Test was aborted by user")
        return
      }

      console.error("[v0] Agentic file workflow error:", error)
      toast({
        title: "Error",
        description: "Failed to complete agentic test",
        variant: "destructive",
      })

      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }
      })
    }
  }

  const runManualTestWorkflow = async (auditSession: AuditSession, testRequest: ManualTestRequest) => {
    console.log("[v0] Starting manual test workflow")
    try {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Test aborted by user")
      }

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = [...prev.stages]
        updatedStages[0] = { ...updatedStages[0], status: "in-progress" }
        return { ...prev, currentStage: 0, stages: updatedStages }
      })

      console.log("[v0] Sending test request:", testRequest)
      const response = await fetch("/api/test-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testRequest),
        signal: abortControllerRef.current?.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to make test request")
      }

      const testResponse: ManualTestResponse = await response.json()
      console.log("[v0] Received test response:", testResponse)

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Test aborted by user")
      }

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = [...prev.stages]
        updatedStages[0] = { ...updatedStages[0], status: "complete" }
        return { ...prev, stages: updatedStages }
      })

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = [...prev.stages]
        updatedStages[1] = { ...updatedStages[1], status: "in-progress" }
        return { ...prev, currentStage: 1, stages: updatedStages }
      })

      const manualTestData: ManualTestData = {
        request: testRequest,
        response: testResponse,
      }

      console.log("[v0] Analyzing response with AI")
      const report = await analyzeManualTest(manualTestData)
      console.log("[v0] Analysis complete:", report)

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Test aborted by user")
      }

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = [...prev.stages]
        updatedStages[1] = { ...updatedStages[1], status: "complete" }
        return { ...prev, stages: updatedStages }
      })

      setSession((prev) => {
        if (!prev) return prev
        const updatedStages = [...prev.stages]
        updatedStages[2] = { ...updatedStages[2], status: "in-progress" }
        return { ...prev, currentStage: 2, stages: updatedStages }
      })

      setTimeout(() => {
        setSession((prev) => {
          if (!prev) return prev
          const updatedStages = [...prev.stages]
          updatedStages[2] = { ...updatedStages[2], status: "complete" }
          return { ...prev, stages: updatedStages, report, manualTestData }
        })

        setTimeout(() => {
          setCurrentStep("results")
          toast({
            title: "Success",
            description: "Manual test completed successfully",
          })
        }, 500)
      }, 1000)
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.message === "Test aborted by user")) {
        console.log("[v0] Test was aborted by user")
        return
      }

      console.error("[v0] Manual test workflow error:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (errorMessage.includes("Google Generative Language API is not enabled")) {
        // Show detailed error with instructions
        const urlMatch = errorMessage.match(/https:\/\/[^\s]+/)
        const activationUrl = urlMatch ? urlMatch[0] : ""

        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            error: errorMessage,
            apiActivationUrl: activationUrl,
          }
        })

        toast({
          title: "Error",
          description: t("geminiApiDisabled"),
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to complete manual test",
          variant: "destructive",
        })
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            error: errorMessage,
          }
        })
      }
    }
  }

  const handleStartNew = () => {
    console.log("[v0] Starting new test")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setCurrentStep("welcome")
    setProjectMetadata(null)
    setSelectedMode(null)
    setAuthConfig(null)
    setSession(null)
    sessionStorage.clearAll()
  }

  const handleStopTest = () => {
    console.log("[v0] Stopping test...")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setSession((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        error: "Testing stopped by user",
      }
    })

    toast({
      title: "Info",
      description: "Testing stopped by user",
    })
    setTimeout(() => {
      setCurrentStep("config")
    }, 1000)
  }

  const handleManualConfigNext = async (testRequest: ManualTestRequest) => {
    console.log("[v0] Manual config step completed:", testRequest)
    sessionStorage.saveManualConfig(testRequest)
    setCurrentStep("running")

    const newSession: AuditSession = {
      workflowType: "manual",
      projectMetadata: projectMetadata!,
      testMode: selectedMode!,
      authConfig: authConfig!,
      currentStage: 0,
      stages: MANUAL_TEST_STAGES.map((stage) => ({ ...stage, status: "pending" })),
    }

    setSession(newSession)
    await runManualTestWorkflow(newSession, testRequest)
  }

  const handleLandingGetStarted = () => {
    console.log("[v0] Landing get started clicked")
    setCurrentStep("welcome")
  }

  const handleTestAnother = () => {
    console.log("[v0] Testing another endpoint (preserving auth and metadata)")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Reset session but keep metadata and auth
    setSession(null)
    setCurrentStep("config")

    toast({
      title: "Ready",
      description: "Configure your next endpoint test",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {currentStep === "landing" && <LandingPage onGetStarted={handleLandingGetStarted} />}

        {currentStep === "welcome" && <WelcomeStep onNext={handleWelcomeNext} />}

        {currentStep === "project-mode" && (
          <ProjectModeStep
            onNext={handleProjectModeNext}
            onBack={() => setCurrentStep("welcome")}
            initialMetadata={projectMetadata || undefined}
            initialMode={selectedMode || undefined}
          />
        )}

        {currentStep === "auth" && (
          <AuthConfigStep
            onNext={handleAuthNext}
            onBack={() => setCurrentStep("project-mode")}
            initialData={authConfig || undefined}
          />
        )}

        {currentStep === "config" && selectedMode === "agentic" && (
          <AgenticConfigStep onNext={handleAgenticConfigNext} onBack={() => setCurrentStep("auth")} />
        )}

        {currentStep === "config" && selectedMode === "manual" && (
          <ManualConfigStep
            onNext={handleManualConfigNext}
            onBack={() => setCurrentStep("auth")}
            initialData={sessionStorage.getManualConfig() || undefined}
          />
        )}

        {currentStep === "running" && session && (
          <div className="space-y-6">
            {session.error && session.error.includes("Google Generative Language API is not enabled") && (
              <Alert variant="destructive">
                <span className="text-xl">⚠️</span>
                <AlertTitle>{t("apiError")}</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p className="font-semibold">{t("geminiApiDisabled")}</p>
                  <p>{t("geminiApiInstructions")}</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>{t("step1")}</li>
                    <li>{t("step2")}</li>
                    <li>{t("step3")}</li>
                    <li>{t("step4")}</li>
                  </ol>
                  {session.apiActivationUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(session.apiActivationUrl, "_blank")}
                      className="mt-2"
                    >
                      <span className="mr-2">🔗</span>
                      Enable API in Google Cloud Console
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground mt-4">{t("alternativeSolution")}</p>
                </AlertDescription>
              </Alert>
            )}

            <ProgressTracker
              stages={session.stages}
              currentStage={session.currentStage}
              error={session.error}
              onStop={handleStopTest}
            />
          </div>
        )}

        {currentStep === "results" && session?.report && (
          <ReportDisplay
            report={session.report}
            onStartNew={handleStartNew}
            testMode={selectedMode || undefined}
            onTestAnother={selectedMode === "manual" ? handleTestAnother : undefined}
            projectMetadata={projectMetadata}
            agenticResult={session.agenticResult}
          />
        )}
      </main>
    </div>
  )
}

function calculateOverallRisk(vulnerabilities: Vulnerability[]): SeverityLevel {
  const hasCritical = vulnerabilities.some((v) => v.severity === "critical")
  const hasHigh = vulnerabilities.some((v) => v.severity === "high")
  const hasMedium = vulnerabilities.some((v) => v.severity === "medium")

  if (hasCritical) return "critical"
  if (hasHigh) return "high"
  if (hasMedium) return "medium"
  if (vulnerabilities.length > 0) return "low"
  return "info"
}

function generateRecommendations(result: AgenticTestResult): string[] {
  const recommendations: string[] = []

  if (result.totalVulnerabilities.length === 0) {
    recommendations.push("No critical vulnerabilities found during automated testing")
    recommendations.push("Continue with manual security review and penetration testing")
  } else {
    recommendations.push(`Address ${result.totalVulnerabilities.length} identified vulnerabilities immediately`)

    const critical = result.totalVulnerabilities.filter((v) => v.severity === "critical")
    if (critical.length > 0) {
      recommendations.push(`URGENT: Fix ${critical.length} critical vulnerabilities before deployment`)
    }

    const high = result.totalVulnerabilities.filter((v) => v.severity === "high")
    if (high.length > 0) {
      recommendations.push(`High priority: Resolve ${high.length} high-severity issues`)
    }
  }

  recommendations.push("Implement automated security testing in CI/CD pipeline")
  recommendations.push("Conduct regular security audits and penetration testing")
  recommendations.push("Follow OWASP API Security Top 10 guidelines")

  return recommendations
}

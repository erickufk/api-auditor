"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { SecurityReport, SeverityLevel, ProjectMetadata, TestMode } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { useMemo } from "react"

interface ReportDisplayProps {
  report: SecurityReport
  onStartNew: () => void
  testMode?: TestMode
  onTestAnother?: () => void
  projectMetadata?: ProjectMetadata | null
  agenticResult?: any
}

export function ReportDisplay({
  report,
  onStartNew,
  testMode,
  onTestAnother,
  projectMetadata,
  agenticResult,
}: ReportDisplayProps) {
  const { t } = useLanguage()

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "high":
        return "bg-destructive/80 text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-warning/60 text-warning-foreground"
      case "info":
        return "bg-muted text-muted-foreground"
    }
  }

  const getRiskScoreColor = (score: SeverityLevel) => {
    switch (score) {
      case "critical":
        return "text-destructive"
      case "high":
        return "text-destructive/80"
      case "medium":
        return "text-warning"
      case "low":
        return "text-success"
      case "info":
        return "text-muted-foreground"
    }
  }

  const testedEndpoints = useMemo(() => {
    const endpoints: Array<{ method: string; url: string; issuesCount: number }> = []

    if (agenticResult?.iterations && agenticResult.iterations.length > 0) {
      // Group iterations by endpoint
      const endpointMap = new Map<string, { method: string; url: string; issues: number }>()

      agenticResult.iterations.forEach((iteration: any) => {
        const key = `${iteration.request.method} ${iteration.request.url}`
        if (!endpointMap.has(key)) {
          endpointMap.set(key, {
            method: iteration.request.method,
            url: iteration.request.url,
            issues: iteration.vulnerabilitiesFound?.length || 0,
          })
        } else {
          const existing = endpointMap.get(key)!
          existing.issues += iteration.vulnerabilitiesFound?.length || 0
        }
      })

      endpointMap.forEach((value) => {
        endpoints.push({
          method: value.method,
          url: value.url,
          issuesCount: value.issues,
        })
      })
    } else if (report.tested_endpoint && report.tested_endpoint !== "N/A") {
      // For single endpoint tests
      const [method, ...urlParts] = report.tested_endpoint.split(" ")
      endpoints.push({
        method: method || "GET",
        url: urlParts.join(" ") || report.tested_endpoint,
        issuesCount: report.vulnerabilities_found,
      })
    }

    return endpoints
  }, [agenticResult, report])

  const generateFullTextReport = () => {
    let textReport = `${t("securityReport").toUpperCase()}\n`
    textReport += `${"=".repeat(80)}\n\n`

    // Project Information
    if (projectMetadata) {
      textReport += `${t("projectInformation").toUpperCase()}\n`
      textReport += `${"-".repeat(80)}\n`
      textReport += `${t("projectName")}: ${projectMetadata.name}\n`
      textReport += `${t("projectDescription")}: ${projectMetadata.description}\n\n`
    }

    // Scan Details
    textReport += `${t("reportDetails").toUpperCase()}\n`
    textReport += `${"-".repeat(80)}\n`
    textReport += `${t("scanId")}: ${report.scan_id}\n`
    textReport += `${t("testedOn")}: ${new Date(report.timestamp).toLocaleString()}\n`
    textReport += `${t("apiName")}: ${report.api_name}\n`
    textReport += `${t("overallRisk")}: ${report.overall_risk_score.toUpperCase()}\n`
    textReport += `${t("endpointsScanned")}: ${report.endpoints_scanned}\n`
    textReport += `${t("totalVulnerabilities")}: ${report.vulnerabilities_found}\n\n`

    // Tested Endpoints
    if (testedEndpoints.length > 0) {
      textReport += `${t("endpointsTested").toUpperCase()} (${testedEndpoints.length})\n`
      textReport += `${"-".repeat(80)}\n`
      testedEndpoints.forEach((endpoint, idx) => {
        textReport += `${idx + 1}. ${endpoint.method} ${endpoint.url}\n`
        textReport += `   ${t("issues")}: ${endpoint.issuesCount}\n`
      })
      textReport += `\n`
    }

    // Severity Summary
    textReport += `${t("severityBreakdown").toUpperCase()}\n`
    textReport += `${"-".repeat(80)}\n`
    textReport += `${t("critical")}: ${report.summary.critical}\n`
    textReport += `${t("high")}: ${report.summary.high}\n`
    textReport += `${t("medium")}: ${report.summary.medium}\n`
    textReport += `${t("low")}: ${report.summary.low}\n`
    textReport += `${t("info")}: ${report.summary.info}\n\n`

    // Agentic Testing Iterations
    if (agenticResult?.iterations && agenticResult.iterations.length > 0) {
      textReport += `${t("agenticTestingIterations").toUpperCase()} (${agenticResult.iterations.length})\n`
      textReport += `${"-".repeat(80)}\n`
      textReport += `${agenticResult.stoppedReason.replace(/_/g, " ")}\n\n`

      agenticResult.iterations.forEach((iteration: any, idx: number) => {
        textReport += `${t("iteration")} ${iteration.iterationNumber}\n`
        textReport += `${"-".repeat(40)}\n`
        textReport += `${t("requestDetails")}:\n`
        textReport += `  ${t("httpMethod")}: ${iteration.request.method}\n`
        textReport += `  URL: ${iteration.request.url}\n`
        textReport += `  ${t("headers")}: ${JSON.stringify(iteration.request.headers, null, 2)}\n`
        if (iteration.request.body) {
          textReport += `  ${t("body")}: ${iteration.request.body}\n`
        }
        textReport += `\n${t("response")}:\n`
        textReport += `  ${t("status")}: ${iteration.response.status} ${iteration.response.statusText}\n`
        textReport += `  ${t("body")}: ${iteration.response.body.substring(0, 1000)}${iteration.response.body.length > 1000 ? "..." : ""}\n`
        textReport += `\n${t("aiAnalysis")}:\n${iteration.analysis}\n`
        textReport += `\n${t("agentReasoning")}:\n${iteration.reasoning}\n`
        textReport += `\n${t("vulnerabilitiesFound")}: ${iteration.vulnerabilitiesFound.length}\n`
        if (iteration.vulnerabilitiesFound.length > 0) {
          iteration.vulnerabilitiesFound.forEach((vuln: any, vIdx: number) => {
            textReport += `  ${vIdx + 1}. [${vuln.severity.toUpperCase()}] ${vuln.title}\n`
            textReport += `     ${vuln.description}\n`
          })
        }
        textReport += `\n`
      })
    }

    // Vulnerabilities
    textReport += `${t("vulnerabilitiesFoundTitle").toUpperCase()} (${report.vulnerabilities.length})\n`
    textReport += `${"-".repeat(80)}\n\n`

    if (report.vulnerabilities.length === 0) {
      textReport += `${t("noVulnerabilitiesFound")}. ${t("apiSecure")}.\n\n`
    } else {
      report.vulnerabilities.forEach((vuln, index) => {
        textReport += `${index + 1}. ${vuln.title}\n`
        textReport += `   ${t("severity")}: ${vuln.severity.toUpperCase()}\n`
        textReport += `   ${t("description")}: ${vuln.description}\n`
        textReport += `   ${t("affectedEndpoints")}: ${vuln.affected_endpoints.join(", ")}\n`
        if (vuln.proof_of_concept) {
          textReport += `   ${t("proofOfConcept")}:\n${vuln.proof_of_concept}\n`
        }
        textReport += `   ${t("remediation")}: ${vuln.remediation}\n`
        if (vuln.cwe_id) textReport += `   ${t("cweId")}: ${vuln.cwe_id}\n`
        if (vuln.cvss_score) textReport += `   ${t("cvssScore")}: ${vuln.cvss_score}\n`
        textReport += `\n`
      })
    }

    // Recommendations
    textReport += `${t("recommendations").toUpperCase()}\n`
    textReport += `${"-".repeat(80)}\n`
    report.recommendations.forEach((rec, index) => {
      textReport += `${index + 1}. ${rec}\n`
    })
    textReport += `\n`

    // Recommended Tests
    if (report.recommendedTests && report.recommendedTests.length > 0) {
      textReport += `${t("recommendedFollowUpTests").toUpperCase()}\n`
      textReport += `${"-".repeat(80)}\n`
      report.recommendedTests.forEach((test, index) => {
        textReport += `${index + 1}. ${test.description}\n`
        textReport += `   ${t("testType")}: ${test.testType}\n`
        textReport += `   ${t("payload")}: ${test.payload}\n`
        textReport += `   ${t("reasoning")}: ${test.reasoning}\n\n`
      })
    }

    // Potential Vulnerabilities
    if (report.potentialVulnerabilities && report.potentialVulnerabilities.length > 0) {
      textReport += `${t("potentialVulnerabilities").toUpperCase()}\n`
      textReport += `${"-".repeat(80)}\n`
      report.potentialVulnerabilities.forEach((vuln, index) => {
        textReport += `${index + 1}. ${vuln.type}\n`
        textReport += `   ${t("likelihood")}: ${vuln.likelihood}\n`
        textReport += `   ${t("testApproach")}: ${vuln.testApproach}\n`
        textReport += `   ${t("reasoning")}: ${vuln.reasoning}\n\n`
      })
    }

    textReport += `${"=".repeat(80)}\n`
    textReport += `End of Report\n`

    return textReport
  }

  const handleDownloadJSON = () => {
    const fullReport = {
      project: projectMetadata,
      report,
      agenticResult,
    }
    const dataStr = JSON.stringify(fullReport, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `security-audit-${report.scan_id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: t("success"),
      description: t("reportDownloaded"),
    })
  }

  const handleDownloadFullTextReport = () => {
    const textReport = generateFullTextReport()
    const dataBlob = new Blob([textReport], { type: "text/plain" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `security-audit-full-${report.scan_id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: t("success"),
      description: t("fullTextReportDownloaded"),
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">{t("securityReport")}</h2>
          <p className="text-pretty text-muted-foreground">{t("comprehensiveAnalysis")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onTestAnother} variant="default">
            {t("testAnotherEndpoint")}
          </Button>
          <Button onClick={onStartNew} variant="outline">
            {t("newAudit")}
          </Button>
        </div>
      </div>

      {projectMetadata && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">{t("projectInformation")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">💼</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t("projectName")}</p>
                <p className="text-sm text-muted-foreground">{projectMetadata.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">📝</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t("projectDescription")}</p>
                <p className="text-sm text-muted-foreground">{projectMetadata.description}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {testedEndpoints.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">
            {t("endpointsTested")} ({testedEndpoints.length})
          </h3>
          <div className="space-y-2">
            {testedEndpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="font-mono">
                  {idx + 1}
                </Badge>
                <code className="flex-1 overflow-x-auto text-sm text-foreground">
                  <span className="font-bold text-primary">{endpoint.method}</span> {endpoint.url}
                </code>
                <Badge className={endpoint.issuesCount > 0 ? "bg-destructive" : "bg-success"}>
                  {endpoint.issuesCount} {t("issues")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("overallRisk")}</p>
              <p className={`text-2xl font-bold ${getRiskScoreColor(report.overall_risk_score)}`}>
                {report.overall_risk_score.toUpperCase()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("endpointsScanned")}</p>
              <p className="text-2xl font-bold text-foreground">{report.endpoints_scanned}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("vulnerabilities")}</p>
              <p className="text-2xl font-bold text-foreground">{report.vulnerabilities_found}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("scanDate")}</p>
              <p className="text-sm font-medium text-foreground">{new Date(report.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Details */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{t("reportDetails")}</h3>
          <div className="flex gap-2">
            <Button onClick={handleDownloadJSON} variant="outline" size="sm">
              {t("json")}
            </Button>
            <Button onClick={handleDownloadFullTextReport} variant="outline" size="sm">
              {t("fullTxtReport")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">#️⃣</span>
            <span className="text-sm text-muted-foreground">{t("scanId")}:</span>
            <span className="font-mono text-sm text-foreground">{report.scan_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📄</span>
            <span className="text-sm text-muted-foreground">{t("apiName")}:</span>
            <span className="text-sm font-medium text-foreground">{report.api_name}</span>
          </div>
        </div>
      </Card>

      {/* Severity Summary */}
      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">{t("severityBreakdown")}</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">{t("critical")}</span>
            <Badge variant="destructive">{report.summary.critical}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">{t("high")}</span>
            <Badge className="bg-destructive/80">{report.summary.high}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">{t("medium")}</span>
            <Badge className="bg-warning text-warning-foreground">{report.summary.medium}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">{t("low")}</span>
            <Badge className="bg-warning/60 text-warning-foreground">{report.summary.low}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">{t("info")}</span>
            <Badge variant="secondary">{report.summary.info}</Badge>
          </div>
        </div>
      </Card>

      {agenticResult && agenticResult.iterations && agenticResult.iterations.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">{t("agenticTestingIterations")}</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("aiAgentPerformed")} {agenticResult.iterations.length} {t("iterationsOfTesting")}{" "}
            {agenticResult.stoppedReason.replace(/_/g, " ")}
          </p>
          <Accordion type="single" collapsible className="w-full">
            {agenticResult.iterations.map((iteration: any, idx: number) => (
              <AccordionItem key={idx} value={`iteration-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <Badge variant="outline">
                      {t("iteration")} {iteration.iterationNumber}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      {iteration.request.method} {iteration.request.url}
                    </span>
                    <Badge className={iteration.vulnerabilitiesFound.length > 0 ? "bg-destructive" : "bg-success"}>
                      {iteration.vulnerabilitiesFound.length} {t("vulnerabilitiesFound")}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("requestDetails")}</p>
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {JSON.stringify(
                          {
                            method: iteration.request.method,
                            url: iteration.request.url,
                            headers: iteration.request.headers,
                            body: iteration.request.body,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("response")}</p>
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {t("status")}: {iteration.response.status} {iteration.response.statusText}
                        {"\n"}
                        {t("body")}: {iteration.response.body.substring(0, 500)}
                        {iteration.response.body.length > 500 ? "..." : ""}
                      </pre>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("aiAnalysis")}</p>
                      <p className="text-sm text-muted-foreground">{iteration.analysis}</p>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("agentReasoning")}</p>
                      <p className="text-sm text-muted-foreground">{iteration.reasoning}</p>
                    </div>

                    {iteration.vulnerabilitiesFound.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-2 text-sm font-medium text-foreground">
                            {t("vulnerabilitiesFoundInIteration")}
                          </p>
                          <div className="space-y-2">
                            {iteration.vulnerabilitiesFound.map((vuln: any, vIdx: number) => (
                              <div key={vIdx} className="rounded-lg border border-border p-3">
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge className={getSeverityColor(vuln.severity)}>
                                    {vuln.severity.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium text-foreground">{vuln.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{vuln.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}

      {/* Recommended Follow-up Tests */}
      {report.recommendedTests && report.recommendedTests.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{t("recommendedFollowUpTests")}</h3>
              <p className="text-sm text-muted-foreground">{t("recommendedTestsDesc")}</p>
            </div>
          </div>
          <div className="space-y-4">
            {report.recommendedTests.map((test, index) => (
              <Card key={index} className="border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background">
                      {test.testType}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{test.description}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{t("payload")}</p>
                    <pre className="rounded-md bg-muted p-2 text-xs font-mono text-foreground">{test.payload}</pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{t("reasoning")}</p>
                    <p className="text-xs text-muted-foreground">{test.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Potential Vulnerabilities */}
      {report.potentialVulnerabilities && report.potentialVulnerabilities.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{t("potentialVulnerabilities")}</h3>
              <p className="text-sm text-muted-foreground">{t("potentialVulnDesc")}</p>
            </div>
          </div>
          <div className="space-y-3">
            {report.potentialVulnerabilities.map((vuln, index) => (
              <Card key={index} className="border-warning/20 bg-warning/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💻</span>
                    <span className="font-medium text-foreground">{vuln.type}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      vuln.likelihood === "high"
                        ? "border-destructive text-destructive"
                        : vuln.likelihood === "medium"
                          ? "border-warning text-warning"
                          : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {t("likelihood")}: {vuln.likelihood}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{t("testApproach")}</p>
                    <p className="text-xs text-muted-foreground">{vuln.testApproach}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{t("reasoning")}</p>
                    <p className="text-xs text-muted-foreground">{vuln.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">{t("vulnerabilitiesFoundTitle")}</h3>
        {report.vulnerabilities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-5xl">✅</span>
            <p className="text-lg font-medium text-foreground">{t("noVulnerabilitiesFound")}</p>
            <p className="text-sm text-muted-foreground">{t("apiSecure")}</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {report.vulnerabilities.map((vuln) => (
              <AccordionItem key={vuln.id} value={vuln.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <Badge className={getSeverityColor(vuln.severity)}>
                      <span className="ml-1">{vuln.severity.toUpperCase()}</span>
                    </Badge>
                    <span className="font-medium text-foreground">{vuln.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("description")}</p>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">{t("affectedEndpoints")}</p>
                      <div className="flex flex-wrap gap-2">
                        {vuln.affected_endpoints.map((endpoint, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {endpoint}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {vuln.proof_of_concept && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-1 text-sm font-medium text-foreground">{t("proofOfConcept")}</p>
                          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                            {vuln.proof_of_concept}
                          </pre>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">{t("remediation")}</p>
                      <p className="text-sm text-muted-foreground">{vuln.remediation}</p>
                    </div>

                    {(vuln.cwe_id || vuln.cvss_score) && (
                      <>
                        <Separator />
                        <div className="flex gap-4">
                          {vuln.cwe_id && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-foreground">{t("cweId")}</p>
                              <Badge variant="outline">{vuln.cwe_id}</Badge>
                            </div>
                          )}
                          {vuln.cvss_score && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-foreground">{t("cvssScore")}</p>
                              <Badge variant="outline">{vuln.cvss_score}</Badge>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">{t("recommendations")}</h3>
        <ul className="space-y-3">
          {report.recommendations.map((rec, index) => (
            <li key={index} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {index + 1}
              </div>
              <p className="text-sm text-muted-foreground">{rec}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

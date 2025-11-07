"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { SecurityReport, SeverityLevel, ProjectMetadata, TestMode } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

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

  const handleDownloadJSON = () => {
    const fullReport = {
      project: projectMetadata,
      report,
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
      title: "Success",
      description: "Report downloaded successfully",
    })
  }

  const handleDownloadPDF = () => {
    let textReport = `API SECURITY AUDIT REPORT\n`
    textReport += `${"=".repeat(50)}\n\n`

    if (projectMetadata) {
      textReport += `PROJECT INFORMATION\n`
      textReport += `${"-".repeat(50)}\n`
      textReport += `Project Name: ${projectMetadata.name}\n`
      textReport += `Description: ${projectMetadata.description}\n\n`
    }

    if (report.tested_endpoint) {
      textReport += `Tested Endpoint: ${report.tested_endpoint}\n`
    }

    textReport += `Scan ID: ${report.scan_id}\n`
    textReport += `Date: ${new Date(report.timestamp).toLocaleString()}\n`
    textReport += `API Name: ${report.api_name}\n`
    textReport += `Overall Risk Score: ${report.overall_risk_score.toUpperCase()}\n`
    textReport += `Endpoints Scanned: ${report.endpoints_scanned}\n`
    textReport += `Vulnerabilities Found: ${report.vulnerabilities_found}\n\n`

    if (agenticResult?.iterations && agenticResult.iterations.length > 0) {
      textReport += `ENDPOINTS TESTED\n`
      textReport += `${"-".repeat(50)}\n`
      agenticResult.iterations.forEach((iteration: any, idx: number) => {
        textReport += `${idx + 1}. ${iteration.request.method} ${iteration.request.url}\n`
      })
      textReport += `\n`
    }

    textReport += `SUMMARY\n`
    textReport += `${"-".repeat(50)}\n`
    textReport += `Critical: ${report.summary.critical}\n`
    textReport += `High: ${report.summary.high}\n`
    textReport += `Medium: ${report.summary.medium}\n`
    textReport += `Low: ${report.summary.low}\n`
    textReport += `Info: ${report.summary.info}\n\n`

    textReport += `VULNERABILITIES\n`
    textReport += `${"-".repeat(50)}\n\n`
    report.vulnerabilities.forEach((vuln, index) => {
      textReport += `${index + 1}. ${vuln.title}\n`
      textReport += `   Severity: ${vuln.severity.toUpperCase()}\n`
      textReport += `   Description: ${vuln.description}\n`
      textReport += `   Affected Endpoints: ${vuln.affected_endpoints.join(", ")}\n`
      textReport += `   Remediation: ${vuln.remediation}\n`
      if (vuln.cwe_id) textReport += `   CWE ID: ${vuln.cwe_id}\n`
      if (vuln.cvss_score) textReport += `   CVSS Score: ${vuln.cvss_score}\n`
      textReport += `\n`
    })

    textReport += `RECOMMENDATIONS\n`
    textReport += `${"-".repeat(50)}\n`
    report.recommendations.forEach((rec, index) => {
      textReport += `${index + 1}. ${rec}\n`
    })

    const dataBlob = new Blob([textReport], { type: "text/plain" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `security-audit-${report.scan_id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: "Success",
      description: "Report downloaded successfully",
    })
  }

  const getTestedEndpoints = () => {
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
  }

  const testedEndpoints = getTestedEndpoints()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Security Audit Report</h2>
          <p className="text-pretty text-muted-foreground">Comprehensive analysis of your API security</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onTestAnother} variant="default">
            🔄 Test Another Endpoint
          </Button>
          <Button onClick={onStartNew} variant="outline">
            ✨ New Audit
          </Button>
        </div>
      </div>

      {projectMetadata && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">Project Information</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">💼</span>
              <div>
                <p className="text-sm font-medium text-foreground">Project Name</p>
                <p className="text-sm text-muted-foreground">{projectMetadata.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">📝</span>
              <div>
                <p className="text-sm font-medium text-foreground">Description</p>
                <p className="text-sm text-muted-foreground">{projectMetadata.description}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {testedEndpoints.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">Endpoints Tested ({testedEndpoints.length})</h3>
          <div className="space-y-2">
            {testedEndpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="font-mono">
                  {idx + 1}
                </Badge>
                <code className="flex-1 text-sm text-foreground">
                  <span className="font-bold text-primary">{endpoint.method}</span> {endpoint.url}
                </code>
                <Badge className={endpoint.issuesCount > 0 ? "bg-destructive" : "bg-success"}>
                  {endpoint.issuesCount} issues
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">Tested Endpoint</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Base Endpoint</p>
            <code className="text-sm font-medium text-foreground">
              {report.tested_endpoint ||
                (agenticResult?.iterations?.[0]?.request
                  ? `${agenticResult.iterations[0].request.method} ${agenticResult.iterations[0].request.url}`
                  : report.vulnerabilities[0]?.affected_endpoints?.[0] || "N/A")}
            </code>
          </div>
        </div>
      </Card>

      {agenticResult && agenticResult.iterations && agenticResult.iterations.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">
            Endpoints Tested ({agenticResult.iterations.length})
          </h3>
          <div className="space-y-2">
            {agenticResult.iterations.map((iteration: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="font-mono">
                  {idx + 1}
                </Badge>
                <code className="flex-1 text-sm text-foreground">
                  <span className="font-bold text-primary">{iteration.request.method}</span> {iteration.request.url}
                </code>
                <Badge className={iteration.vulnerabilitiesFound.length > 0 ? "bg-destructive" : "bg-success"}>
                  {iteration.vulnerabilitiesFound.length} issues
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
              <p className="text-sm text-muted-foreground">Overall Risk</p>
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
              <p className="text-sm text-muted-foreground">Endpoints Scanned</p>
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
              <p className="text-sm text-muted-foreground">Vulnerabilities</p>
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
              <p className="text-sm text-muted-foreground">Scan Date</p>
              <p className="text-sm font-medium text-foreground">{new Date(report.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Details */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Report Details</h3>
          <div className="flex gap-2">
            <Button onClick={handleDownloadJSON} variant="outline" size="sm">
              ⬇️ JSON
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              ⬇️ TXT
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">#️⃣</span>
            <span className="text-sm text-muted-foreground">Scan ID:</span>
            <span className="font-mono text-sm text-foreground">{report.scan_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📄</span>
            <span className="text-sm text-muted-foreground">API Name:</span>
            <span className="text-sm font-medium text-foreground">{report.api_name}</span>
          </div>
        </div>
      </Card>

      {/* Severity Summary */}
      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">Severity Breakdown</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">Critical</span>
            <Badge variant="destructive">{report.summary.critical}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">High</span>
            <Badge className="bg-destructive/80">{report.summary.high}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">Medium</span>
            <Badge className="bg-warning text-warning-foreground">{report.summary.medium}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">Low</span>
            <Badge className="bg-warning/60 text-warning-foreground">{report.summary.low}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-foreground">Info</span>
            <Badge variant="secondary">{report.summary.info}</Badge>
          </div>
        </div>
      </Card>

      {agenticResult && agenticResult.iterations && agenticResult.iterations.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-xl font-semibold text-foreground">Agentic Testing Iterations</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            The AI agent performed {agenticResult.iterations.length} iterations of autonomous testing. Stopped reason:{" "}
            {agenticResult.stoppedReason.replace(/_/g, " ")}
          </p>
          <Accordion type="single" collapsible className="w-full">
            {agenticResult.iterations.map((iteration: any, idx: number) => (
              <AccordionItem key={idx} value={`iteration-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <Badge variant="outline">Iteration {iteration.iterationNumber}</Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      {iteration.request.method} {iteration.request.url}
                    </span>
                    <Badge className={iteration.vulnerabilitiesFound.length > 0 ? "bg-destructive" : "bg-success"}>
                      {iteration.vulnerabilitiesFound.length} vulnerabilities
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">Request Details</p>
                      <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
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
                      <p className="mb-1 text-sm font-medium text-foreground">Response</p>
                      <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        Status: {iteration.response.status} {iteration.response.statusText}
                        {"\n"}
                        Body: {iteration.response.body.substring(0, 500)}
                        {iteration.response.body.length > 500 ? "..." : ""}
                      </pre>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">{iteration.analysis}</p>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">Agent Reasoning</p>
                      <p className="text-sm text-muted-foreground">{iteration.reasoning}</p>
                    </div>

                    {iteration.vulnerabilitiesFound.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-2 text-sm font-medium text-foreground">
                            Vulnerabilities Found in This Iteration
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

      {/* Vulnerabilities */}
      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">Vulnerabilities Found</h3>
        {report.vulnerabilities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-5xl">✅</span>
            <p className="text-lg font-medium text-foreground">No vulnerabilities found</p>
            <p className="text-sm text-muted-foreground">Your API appears to be secure</p>
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
                      <p className="mb-1 text-sm font-medium text-foreground">Description</p>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">Affected Endpoints</p>
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
                          <p className="mb-1 text-sm font-medium text-foreground">Proof of Concept</p>
                          <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                            {vuln.proof_of_concept}
                          </pre>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium text-foreground">Remediation</p>
                      <p className="text-sm text-muted-foreground">{vuln.remediation}</p>
                    </div>

                    {(vuln.cwe_id || vuln.cvss_score) && (
                      <>
                        <Separator />
                        <div className="flex gap-4">
                          {vuln.cwe_id && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-foreground">CWE ID</p>
                              <Badge variant="outline">{vuln.cwe_id}</Badge>
                            </div>
                          )}
                          {vuln.cvss_score && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-foreground">CVSS Score</p>
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
        <h3 className="mb-4 text-xl font-semibold text-foreground">Recommendations</h3>
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

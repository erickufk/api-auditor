import type {
  AgenticConfig,
  AgenticIteration,
  AgenticTestResult,
  ManualTestRequest,
  ManualTestResponse,
  Vulnerability,
} from "./types"

export async function runAgenticWorkflow(
  initialRequest: ManualTestRequest,
  config: AgenticConfig,
  onProgress: (iteration: number, total: number, status: string) => void,
): Promise<AgenticTestResult> {
  const iterations: AgenticIteration[] = []
  const allVulnerabilities: Vulnerability[] = []
  let stoppedReason: AgenticTestResult["stoppedReason"] = "no_more_tests"

  try {
    // Iteration 0: Execute initial request
    onProgress(0, config.maxIterations, "Executing initial request...")
    const initialResponse = await executeRequest(initialRequest)

    // Analyze initial response
    onProgress(0, config.maxIterations, "Analyzing initial response with Gemini...")
    const initialAnalysis = await analyzeWithGemini(initialRequest, initialResponse, [], config.aggressiveness, 0)

    iterations.push({
      iterationNumber: 0,
      request: initialRequest,
      response: initialResponse,
      analysis: initialAnalysis.analysis,
      vulnerabilitiesFound: initialAnalysis.vulnerabilitiesFound,
      reasoning: initialAnalysis.reasoning,
      timestamp: new Date().toISOString(),
    })

    allVulnerabilities.push(...initialAnalysis.vulnerabilitiesFound)

    // Check if we should stop after initial test
    if (
      config.stopOnVulnerability &&
      initialAnalysis.vulnerabilitiesFound.some((v) => v.severity === "critical" || v.severity === "high")
    ) {
      stoppedReason = "vulnerability_found"
      return {
        iterations,
        totalVulnerabilities: allVulnerabilities,
        summary: generateSummary(iterations, allVulnerabilities, stoppedReason),
        stoppedReason,
      }
    }

    if (!initialAnalysis.shouldContinue || initialAnalysis.followUpTests.length === 0) {
      stoppedReason = "no_more_tests"
      return {
        iterations,
        totalVulnerabilities: allVulnerabilities,
        summary: generateSummary(iterations, allVulnerabilities, stoppedReason),
        stoppedReason,
      }
    }

    let currentFollowUpTests = initialAnalysis.followUpTests

    for (let i = 1; i < config.maxIterations; i++) {
      if (currentFollowUpTests.length === 0) {
        stoppedReason = "no_more_tests"
        break
      }

      // Execute the first follow-up test from the current list
      const followUpTest = currentFollowUpTests[0]
      onProgress(i, config.maxIterations, `Executing test: ${followUpTest.description}`)

      const testRequest: ManualTestRequest = {
        url: followUpTest.url,
        method: followUpTest.method,
        headers: followUpTest.headers,
        body: followUpTest.body,
      }

      // Add delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const testResponse = await executeRequest(testRequest)

      onProgress(i, config.maxIterations, "Analyzing response with Gemini...")
      const analysis = await analyzeWithGemini(testRequest, testResponse, iterations, config.aggressiveness, i)

      iterations.push({
        iterationNumber: i,
        request: testRequest,
        response: testResponse,
        analysis: analysis.analysis,
        vulnerabilitiesFound: analysis.vulnerabilitiesFound,
        reasoning: analysis.reasoning,
        timestamp: new Date().toISOString(),
      })

      allVulnerabilities.push(...analysis.vulnerabilitiesFound)

      // Check stopping conditions
      if (
        config.stopOnVulnerability &&
        analysis.vulnerabilitiesFound.some((v) => v.severity === "critical" || v.severity === "high")
      ) {
        stoppedReason = "vulnerability_found"
        break
      }

      if (!analysis.shouldContinue || analysis.followUpTests.length === 0) {
        stoppedReason = "no_more_tests"
        break
      }

      // Update follow-up tests for next iteration
      currentFollowUpTests = analysis.followUpTests
    }

    if (iterations.length >= config.maxIterations) {
      stoppedReason = "max_iterations"
    }

    return {
      iterations,
      totalVulnerabilities: allVulnerabilities,
      summary: generateSummary(iterations, allVulnerabilities, stoppedReason),
      stoppedReason,
    }
  } catch (error) {
    console.error("[v0] Agentic workflow error:", error)
    stoppedReason = "error"
    return {
      iterations,
      totalVulnerabilities: allVulnerabilities,
      summary: generateSummary(iterations, allVulnerabilities, stoppedReason),
      stoppedReason,
    }
  }
}

async function executeRequest(request: ManualTestRequest): Promise<ManualTestResponse> {
  const response = await fetch("/api/test-endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Failed to execute request: ${response.statusText}`)
  }

  return await response.json()
}

async function analyzeWithGemini(
  request: ManualTestRequest,
  response: ManualTestResponse,
  previousIterations: AgenticIteration[],
  aggressiveness: "low" | "medium" | "high",
  iterationNumber: number,
) {
  const analysisResponse = await fetch("/api/analyze-agentic-iteration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request,
      response,
      previousIterations,
      aggressiveness,
      iterationNumber,
    }),
  })

  if (!analysisResponse.ok) {
    const errorData = await analysisResponse.json()
    throw new Error(errorData.error || "Failed to analyze iteration")
  }

  return await analysisResponse.json()
}

function generateSummary(
  iterations: AgenticIteration[],
  vulnerabilities: Vulnerability[],
  stoppedReason: AgenticTestResult["stoppedReason"],
): string {
  const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length
  const mediumCount = vulnerabilities.filter((v) => v.severity === "medium").length
  const lowCount = vulnerabilities.filter((v) => v.severity === "low").length

  const reasonText = {
    max_iterations: "Reached maximum iteration limit",
    vulnerability_found: "Stopped after finding critical/high severity vulnerability",
    no_more_tests: "Agent determined no more tests needed",
    error: "Stopped due to error",
  }[stoppedReason]

  return `Agentic security audit completed after ${iterations.length} iterations. ${reasonText}.

Found ${vulnerabilities.length} total vulnerabilities:
- Critical: ${criticalCount}
- High: ${highCount}
- Medium: ${mediumCount}
- Low: ${lowCount}

The AI agent autonomously explored the API endpoint, generated and executed ${iterations.length} test variations, and provided detailed security analysis for each iteration.`
}

export function getTestedEndpoint(iterations: AgenticIteration[]): string {
  if (iterations.length === 0) return "N/A"
  const firstIteration = iterations[0]
  return `${firstIteration.request.method} ${firstIteration.request.url}`
}

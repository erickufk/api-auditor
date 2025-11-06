import type { ManualTestData, SecurityReport } from "./types"

export async function analyzeManualTest(testData: ManualTestData): Promise<SecurityReport> {
  const { request, response } = testData

  const prompt = `You are an API Security Expert. A security test was performed on a single API endpoint.

TEST DETAILS:
Endpoint: ${request.method} ${request.url}

REQUEST SENT:
Headers: ${JSON.stringify(request.headers, null, 2)}
${request.body ? `Body: ${request.body}` : "Body: (none)"}

ACTUAL RESPONSE RECEIVED:
Status Code: ${response.status} ${response.statusText}
Headers: ${JSON.stringify(response.headers, null, 2)}
Body: ${response.body}

TASK:
Perform a comprehensive security analysis of this single request-response pair. Analyze according to the OWASP API Security Top 10:

1. Identify potential vulnerabilities such as:
   - Verbose error messages or information disclosure
   - Insecure headers (missing security headers, dangerous CORS settings)
   - Authentication/authorization issues
   - Injection vulnerabilities (based on response behavior)
   - Sensitive data exposure
   - Rate limiting issues
   - Security misconfigurations

2. Generate recommended follow-up test requests with specific payloads that should be tested on this endpoint:
   - SQL injection payloads
   - BOLA/IDOR tests (object reference manipulation)
   - XSS payloads
   - Authentication bypass attempts
   - Parameter tampering tests

3. Compile all findings into a comprehensive security report.

Return a JSON object matching this EXACT structure:
{
  "scan_id": "string (generate UUID like 'manual-test-xxxxx')",
  "timestamp": "ISO 8601 timestamp (current time)",
  "api_name": "string (extract from URL or use 'Manual Test')",
  "overall_risk_score": "critical|high|medium|low|info",
  "endpoints_scanned": 1,
  "vulnerabilities_found": number,
  "vulnerabilities": [
    {
      "id": "string (e.g., 'VULN-001')",
      "title": "string",
      "severity": "critical|high|medium|low|info",
      "description": "string (detailed explanation)",
      "affected_endpoints": ["${request.method} ${request.url}"],
      "proof_of_concept": "string (show the actual request/response that demonstrates the issue)",
      "remediation": "string (specific steps to fix)",
      "cwe_id": "string (optional, e.g., 'CWE-200')",
      "cvss_score": number (optional, 0-10)
    }
  ],
  "summary": {
    "critical": number,
    "high": number,
    "medium": number,
    "low": number,
    "info": number
  },
  "recommendations": [
    "string (specific actionable recommendations including suggested follow-up tests)"
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations outside the JSON.`

  console.log("[v0] Sending test data to server for AI analysis")

  const responseFromServer = await fetch("/api/analyze-manual-test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testData),
  })

  if (!responseFromServer.ok) {
    const errorData = await responseFromServer.json().catch(() => ({ error: "Unknown error" }))

    if (errorData.isApiDisabled && errorData.activationUrl) {
      throw new Error(
        `Google Generative Language API is not enabled. Please enable it at: ${errorData.activationUrl}\n\n` +
          `After enabling, wait a few minutes and try again.`,
      )
    }

    throw new Error(errorData.error || `Analysis failed with status ${responseFromServer.status}`)
  }

  const report = await responseFromServer.json()
  console.log("[v0] Received analysis report from server")
  return report
}

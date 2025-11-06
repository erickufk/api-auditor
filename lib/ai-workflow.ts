import { generateText } from "ai"
import type { AuditSession, Endpoint, SecurityReport } from "./types"

// Stage 1: Analyze API Documentation
export async function analyzeAPIDocumentation(fileContent: string, fileName: string) {
  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Analyze this OpenAPI specification and extract key information.

File: ${fileName}
Content:
${fileContent}

Extract and return a JSON object with:
1. api_name: The name of the API
2. endpoints: Array of endpoints with path, method, parameters, authentication requirements, and description
3. authentication_methods: List of authentication methods used
4. key_observations: Important security-relevant observations

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Stage 2: Generate Vulnerability Tests
export async function generateVulnerabilityTests(endpoints: Endpoint[], apiName: string) {
  const endpointsSummary = endpoints.map((e) => `${e.method} ${e.path}`).join("\n")

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Generate vulnerability test scenarios for this API.

API: ${apiName}
Endpoints:
${endpointsSummary}

Identify potential vulnerabilities in these categories:
- Injection attacks (SQL, NoSQL, Command injection)
- Broken authentication
- Sensitive data exposure
- XML external entities (XXE)
- Broken access control
- Security misconfiguration
- Cross-site scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging and monitoring

Return a JSON object with:
{
  "test_scenarios": [
    {
      "vulnerability_type": "string",
      "affected_endpoints": ["string"],
      "test_description": "string",
      "severity": "critical|high|medium|low"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Stage 3: Test Authentication
export async function testAuthentication(endpoints: Endpoint[], apiName: string) {
  const authEndpoints = endpoints.filter((e) => e.authentication && e.authentication.length > 0)

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Analyze authentication and authorization mechanisms.

API: ${apiName}
Authenticated Endpoints: ${authEndpoints.length}

Analyze for:
- Weak authentication mechanisms
- Missing authentication on sensitive endpoints
- Broken authorization (IDOR, privilege escalation)
- Token security issues
- Session management vulnerabilities

Return a JSON object with:
{
  "auth_findings": [
    {
      "issue": "string",
      "severity": "critical|high|medium|low",
      "affected_endpoints": ["string"],
      "description": "string"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Stage 4: Generate Fuzzing Tests
export async function generateFuzzingTests(endpoints: Endpoint[]) {
  const endpointsWithParams = endpoints.filter((e) => e.parameters && Object.keys(e.parameters).length > 0)

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Generate fuzzing test cases for input validation.

Endpoints with parameters: ${endpointsWithParams.length}

Generate fuzzing tests for:
- Boundary value testing
- Invalid data types
- Special characters and encoding issues
- Buffer overflow attempts
- Format string vulnerabilities

Return a JSON object with:
{
  "fuzzing_tests": [
    {
      "endpoint": "string",
      "parameter": "string",
      "test_cases": ["string"],
      "expected_behavior": "string"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Stage 5: Test Business Logic
export async function testBusinessLogic(endpoints: Endpoint[], apiName: string) {
  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Analyze potential business logic vulnerabilities.

API: ${apiName}
Total Endpoints: ${endpoints.length}

Analyze for:
- Race conditions
- Business flow bypass
- Insufficient rate limiting
- Price manipulation
- Quantity manipulation
- Workflow violations

Return a JSON object with:
{
  "business_logic_findings": [
    {
      "vulnerability": "string",
      "severity": "critical|high|medium|low",
      "description": "string",
      "affected_endpoints": ["string"]
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Stage 6: Generate Final Security Report
export async function generateSecurityReport(
  apiName: string,
  endpoints: Endpoint[],
  allFindings: {
    vulnerabilityTests: unknown
    authFindings: unknown
    fuzzingTests: unknown
    businessLogicFindings: unknown
  },
): Promise<SecurityReport> {
  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are an API security expert. Generate a comprehensive security audit report.

API: ${apiName}
Endpoints Scanned: ${endpoints.length}

Findings:
${JSON.stringify(allFindings, null, 2)}

Generate a comprehensive security report with:
1. List of vulnerabilities with:
   - Unique ID
   - Title
   - Severity (critical, high, medium, low, info)
   - Description
   - Affected endpoints
   - Proof of concept (if applicable)
   - Remediation steps
   - CWE ID (if applicable)
   - CVSS score (if applicable)

2. Summary counts by severity
3. Overall risk score (critical, high, medium, low, info)
4. Top recommendations

Return a JSON object matching this structure:
{
  "scan_id": "string (generate UUID)",
  "timestamp": "ISO 8601 timestamp",
  "api_name": "string",
  "overall_risk_score": "critical|high|medium|low|info",
  "endpoints_scanned": number,
  "vulnerabilities_found": number,
  "vulnerabilities": [
    {
      "id": "string",
      "title": "string",
      "severity": "critical|high|medium|low|info",
      "description": "string",
      "affected_endpoints": ["string"],
      "proof_of_concept": "string (optional)",
      "remediation": "string",
      "cwe_id": "string (optional)",
      "cvss_score": number (optional)
    }
  ],
  "summary": {
    "critical": number,
    "high": number,
    "medium": number,
    "low": number,
    "info": number
  },
  "recommendations": ["string"]
}

Return ONLY valid JSON, no markdown formatting.`,
  })

  return JSON.parse(text)
}

// Main workflow orchestrator
export async function runSecurityAudit(
  session: AuditSession,
  onStageUpdate: (stageIndex: number, status: "in-progress" | "complete" | "error", error?: string) => void,
): Promise<SecurityReport> {
  let apiInfo: { api_name: string; endpoints: Endpoint[] }
  let vulnerabilityTests: unknown
  let authFindings: unknown
  let fuzzingTests: unknown
  let businessLogicFindings: unknown

  try {
    // Stage 0: API Documentation Analysis
    onStageUpdate(0, "in-progress")
    apiInfo = await analyzeAPIDocumentation(session.fileContent, session.fileName)
    onStageUpdate(0, "complete")

    // Stage 1: Vulnerability Test Generation
    onStageUpdate(1, "in-progress")
    vulnerabilityTests = await generateVulnerabilityTests(apiInfo.endpoints, apiInfo.api_name)
    onStageUpdate(1, "complete")

    // Stage 2: Authentication Testing
    onStageUpdate(2, "in-progress")
    authFindings = await testAuthentication(apiInfo.endpoints, apiInfo.api_name)
    onStageUpdate(2, "complete")

    // Stage 3: Fuzzing Test Generation
    onStageUpdate(3, "in-progress")
    fuzzingTests = await generateFuzzingTests(apiInfo.endpoints)
    onStageUpdate(3, "complete")

    // Stage 4: Business Logic Testing
    onStageUpdate(4, "in-progress")
    businessLogicFindings = await testBusinessLogic(apiInfo.endpoints, apiInfo.api_name)
    onStageUpdate(4, "complete")

    // Stage 5: Generate Final Report
    onStageUpdate(5, "in-progress")
    const report = await generateSecurityReport(apiInfo.api_name, apiInfo.endpoints, {
      vulnerabilityTests,
      authFindings,
      fuzzingTests,
      businessLogicFindings,
    })
    onStageUpdate(5, "complete")

    return report
  } catch (error) {
    console.error("[v0] Error in security audit workflow:", error)
    throw error
  }
}

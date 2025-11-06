export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info"

export type StageStatus = "pending" | "in-progress" | "complete" | "error"

export interface Stage {
  id: string
  name: string
  status: StageStatus
  description?: string
}

export interface Endpoint {
  path: string
  method: string
  parameters?: Record<string, unknown>
  authentication?: string[]
  description?: string
}

export interface Vulnerability {
  id: string
  title: string
  severity: SeverityLevel
  description: string
  affected_endpoints: string[]
  proof_of_concept?: string
  remediation: string
  cwe_id?: string
  cvss_score?: number
}

export interface SecurityReport {
  scan_id: string
  timestamp: string
  api_name: string
  overall_risk_score: SeverityLevel
  endpoints_scanned: number
  vulnerabilities_found: number
  vulnerabilities: Vulnerability[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  recommendations: string[]
  recommendedTests?: RecommendedTest[]
  potentialVulnerabilities?: PotentialVulnerability[]
}

export interface RecommendedTest {
  description: string
  payload: string
  reasoning: string
  testType: string
}

export interface PotentialVulnerability {
  type: string
  likelihood: "high" | "medium" | "low"
  testApproach: string
  reasoning: string
}

export interface ManualTestRequest {
  url: string
  method: string
  headers: Record<string, string>
  queryParams?: Record<string, string>
  body?: string
}

export interface ManualTestResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
}

export interface ManualTestData {
  request: ManualTestRequest
  response: ManualTestResponse
}

export interface AgenticConfig {
  enabled: boolean
  maxIterations: number
  stopOnVulnerability: boolean
  aggressiveness: "low" | "medium" | "high"
  enableFuzzing: boolean
  fuzzingIntensity: "low" | "medium" | "high"
  enableOpenDoorsDetection: boolean
}

export interface AgenticIteration {
  iterationNumber: number
  request: ManualTestRequest
  response: ManualTestResponse
  analysis: string
  vulnerabilitiesFound: Vulnerability[]
  reasoning: string
  timestamp: string
}

export interface AgenticTestResult {
  iterations: AgenticIteration[]
  totalVulnerabilities: Vulnerability[]
  summary: string
  stoppedReason: "max_iterations" | "vulnerability_found" | "no_more_tests" | "error"
  endpointResults?: Array<{
    endpoint: ParsedEndpoint
    result: AgenticTestResult
  }>
}

export type WorkflowType = "automated" | "manual"

export interface ProjectMetadata {
  name: string
  description: string
}

export type TestMode = "agentic" | "manual"

export type AuthMethod = "none" | "bearer" | "api-key" | "basic" | "oauth2"

export interface AuthConfig {
  method: AuthMethod
  loginEndpoint?: string
  loginMethod?: "POST" | "GET"
  loginBody?: string
  // Bearer Token
  token?: string
  // API Key
  apiKey?: string
  apiKeyLocation?: "header" | "query"
  apiKeyName?: string
  // Basic Auth
  username?: string
  password?: string
  // OAuth 2.0
  clientId?: string
  clientSecret?: string
  tokenEndpoint?: string
  accessToken?: string
}

export interface AgenticInput {
  type: "file" | "manual"
  fileContent?: string
  fileName?: string
  endpoint?: {
    url: string
    method: string
    headers?: Record<string, string>
    queryParams?: Record<string, string>
    body?: string
  }
}

export interface ParsedEndpoint {
  path: string
  method: string
  summary?: string
  description?: string
  parameters?: Array<{
    name: string
    in: "query" | "header" | "path" | "body"
    required?: boolean
    schema?: any
  }>
  requestBody?: {
    content?: Record<string, any>
  }
  security?: Array<Record<string, string[]>>
}

export interface ParsedOpenAPISpec {
  title: string
  version: string
  baseUrl?: string
  endpoints: ParsedEndpoint[]
}

export interface AuditSession {
  projectMetadata: ProjectMetadata
  testMode: TestMode
  authConfig: AuthConfig
  workflowType: WorkflowType
  agenticInput?: AgenticInput
  fileName?: string
  fileContent?: string
  manualTestData?: ManualTestData
  agenticConfig?: AgenticConfig
  agenticResult?: AgenticTestResult
  currentStage: number
  stages: Stage[]
  endpoints?: Endpoint[]
  report?: SecurityReport
  error?: string
  apiActivationUrl?: string
}

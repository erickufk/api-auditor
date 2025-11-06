export interface OpenDoorCheck {
  type: string
  description: string
  url: string
  method: string
  headers?: Record<string, string>
  expectedIndicators: string[]
}

export class OpenDoorsDetector {
  static generateChecks(baseUrl: string): OpenDoorCheck[] {
    const checks: OpenDoorCheck[] = []

    // Extract base URL without path
    let cleanBaseUrl: string
    try {
      const urlObj = new URL(baseUrl)
      cleanBaseUrl = `${urlObj.protocol}//${urlObj.host}`
    } catch {
      cleanBaseUrl = baseUrl
    }

    // Debug/Admin Endpoints
    const debugPaths = [
      "/debug",
      "/test",
      "/dev",
      "/swagger",
      "/api-docs",
      "/docs",
      "/api/docs",
      "/graphql",
      "/graphiql",
      "/admin",
      "/console",
      "/actuator",
      "/actuator/health",
      "/health",
      "/status",
      "/metrics",
      "/.env",
      "/config",
      "/phpinfo.php",
      "/info.php",
      "/server-status",
      "/api/v1/debug",
      "/api/debug",
    ]

    debugPaths.forEach((path) => {
      checks.push({
        type: "debug_endpoint",
        description: `Check for debug endpoint: ${path}`,
        url: `${cleanBaseUrl}${path}`,
        method: "GET",
        expectedIndicators: ["debug", "test", "swagger", "graphql", "admin", "console", "actuator"],
      })
    })

    // Test without authentication
    checks.push({
      type: "no_auth",
      description: "Test endpoint without authentication headers",
      url: baseUrl,
      method: "GET",
      headers: {}, // No auth headers
      expectedIndicators: ["200", "success", "data"],
    })

    // Test with common test credentials
    const testCredentials = [
      { user: "admin", pass: "admin" },
      { user: "test", pass: "test" },
      { user: "demo", pass: "demo" },
      { user: "root", pass: "root" },
    ]

    testCredentials.forEach((cred) => {
      const authHeader = `Basic ${btoa(`${cred.user}:${cred.pass}`)}`
      checks.push({
        type: "default_credentials",
        description: `Test with default credentials: ${cred.user}/${cred.pass}`,
        url: baseUrl,
        method: "GET",
        headers: { Authorization: authHeader },
        expectedIndicators: ["200", "success", "authenticated", "token"],
      })
    })

    // Check for verbose errors
    checks.push({
      type: "verbose_errors",
      description: "Test for verbose error messages",
      url: `${baseUrl}?id=INVALID_ID_TEST_12345`,
      method: "GET",
      expectedIndicators: ["error", "exception", "stack", "trace", "sql", "database", "file", "line"],
    })

    // Check for information disclosure in headers
    checks.push({
      type: "info_disclosure",
      description: "Check response headers for information disclosure",
      url: baseUrl,
      method: "OPTIONS",
      expectedIndicators: ["server", "x-powered-by", "x-aspnet-version", "x-framework"],
    })

    return checks
  }

  static async executeCheck(check: OpenDoorCheck): Promise<{
    check: OpenDoorCheck
    found: boolean
    evidence: string[]
    response?: { status: number; headers: Record<string, string>; body: string }
  }> {
    try {
      const response = await fetch("/api/test-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: check.url,
          method: check.method,
          headers: check.headers || {},
        }),
      })

      if (!response.ok) {
        return { check, found: false, evidence: [] }
      }

      const data = await response.json()
      const evidence: string[] = []

      // Check status code
      if (data.status === 200) {
        evidence.push(`HTTP 200 OK response`)
      }

      // Check response body for indicators
      const bodyLower = data.body.toLowerCase()
      check.expectedIndicators.forEach((indicator) => {
        if (bodyLower.includes(indicator.toLowerCase())) {
          evidence.push(`Found indicator in body: "${indicator}"`)
        }
      })

      // Check headers for indicators
      Object.entries(data.headers).forEach(([key, value]) => {
        check.expectedIndicators.forEach((indicator) => {
          if (
            key.toLowerCase().includes(indicator.toLowerCase()) ||
            String(value).toLowerCase().includes(indicator.toLowerCase())
          ) {
            evidence.push(`Found indicator in header ${key}: "${value}"`)
          }
        })
      })

      return {
        check,
        found: evidence.length > 0,
        evidence,
        response: data,
      }
    } catch (error) {
      return { check, found: false, evidence: [] }
    }
  }
}

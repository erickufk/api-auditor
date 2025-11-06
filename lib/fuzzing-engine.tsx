export interface FuzzingPayload {
  type: string
  description: string
  value: string | number | null
  category: "boundary" | "format" | "injection" | "logic"
}

export class FuzzingEngine {
  static generatePayloads(
    paramName: string,
    paramType = "string",
    intensity: "low" | "medium" | "high" = "medium",
  ): FuzzingPayload[] {
    const payloads: FuzzingPayload[] = []

    // Boundary Testing
    if (intensity === "high" || intensity === "medium") {
      payloads.push(
        { type: "empty_string", description: "Empty string", value: "", category: "boundary" },
        {
          type: "very_long_string",
          description: "Very long string (10000 chars)",
          value: "A".repeat(10000),
          category: "boundary",
        },
        { type: "negative_number", description: "Negative number", value: -1, category: "boundary" },
        { type: "zero", description: "Zero value", value: 0, category: "boundary" },
        { type: "null", description: "Null value", value: null, category: "boundary" },
      )
    }

    // Format Fuzzing
    payloads.push(
      { type: "special_chars", description: "Special characters", value: "<>\"'\\`", category: "format" },
      { type: "unicode", description: "Unicode characters", value: "测试🔥", category: "format" },
      { type: "newlines", description: "Newline characters", value: "test\\ntest\\r\\n", category: "format" },
    )

    if (intensity === "high" || intensity === "medium") {
      payloads.push(
        { type: "null_byte", description: "Null byte", value: "test\\x00test", category: "format" },
        { type: "control_chars", description: "Control characters", value: "\\x01\\x02\\x03", category: "format" },
      )
    }

    // SQL Injection Patterns
    payloads.push(
      { type: "sql_injection_1", description: "SQL injection (OR)", value: "' OR '1'='1", category: "injection" },
      {
        type: "sql_injection_2",
        description: "SQL injection (UNION)",
        value: "' UNION SELECT NULL--",
        category: "injection",
      },
      { type: "sql_injection_3", description: "SQL injection (comment)", value: "admin'--", category: "injection" },
    )

    if (intensity === "high") {
      payloads.push(
        {
          type: "sql_injection_4",
          description: "SQL injection (time-based)",
          value: "'; WAITFOR DELAY '00:00:05'--",
          category: "injection",
        },
        {
          type: "sql_injection_5",
          description: "SQL injection (stacked)",
          value: "'; DROP TABLE users--",
          category: "injection",
        },
      )
    }

    // XSS Patterns
    payloads.push(
      { type: "xss_1", description: "XSS (script tag)", value: "<script>alert('XSS')</script>", category: "injection" },
      { type: "xss_2", description: "XSS (img tag)", value: "<img src=x onerror=alert('XSS')>", category: "injection" },
    )

    if (intensity === "high" || intensity === "medium") {
      payloads.push(
        { type: "xss_3", description: "XSS (event handler)", value: "javascript:alert('XSS')", category: "injection" },
        {
          type: "xss_4",
          description: "XSS (encoded)",
          value: "%3Cscript%3Ealert('XSS')%3C/script%3E",
          category: "injection",
        },
      )
    }

    // Command Injection
    if (intensity === "high" || intensity === "medium") {
      payloads.push(
        { type: "cmd_injection_1", description: "Command injection (pipe)", value: "| ls -la", category: "injection" },
        {
          type: "cmd_injection_2",
          description: "Command injection (semicolon)",
          value: "; cat /etc/passwd",
          category: "injection",
        },
        {
          type: "cmd_injection_3",
          description: "Command injection (backtick)",
          value: "`whoami`",
          category: "injection",
        },
      )
    }

    // NoSQL Injection
    if (intensity === "high") {
      payloads.push(
        {
          type: "nosql_injection_1",
          description: "NoSQL injection (ne)",
          value: '{"$ne": null}',
          category: "injection",
        },
        { type: "nosql_injection_2", description: "NoSQL injection (gt)", value: '{"$gt": ""}', category: "injection" },
      )
    }

    // Logic Fuzzing
    payloads.push(
      { type: "negative_quantity", description: "Negative quantity", value: -999, category: "logic" },
      { type: "huge_number", description: "Huge number", value: 999999999999, category: "logic" },
    )

    if (intensity === "high" || intensity === "medium") {
      payloads.push(
        { type: "future_date", description: "Future date", value: "2099-12-31", category: "logic" },
        { type: "past_date", description: "Past date", value: "1900-01-01", category: "logic" },
      )
    }

    return payloads
  }

  static applyFuzzingToRequest(
    baseRequest: { url: string; method: string; headers: Record<string, string>; body?: string },
    payload: FuzzingPayload,
    targetLocation: "query" | "body" | "header",
    targetParam: string,
  ): { url: string; method: string; headers: Record<string, string>; body?: string } {
    const fuzzedRequest = { ...baseRequest, headers: { ...baseRequest.headers } }

    if (targetLocation === "query") {
      const url = new URL(baseRequest.url)
      url.searchParams.set(targetParam, String(payload.value))
      fuzzedRequest.url = url.toString()
    } else if (targetLocation === "header") {
      fuzzedRequest.headers[targetParam] = String(payload.value)
    } else if (targetLocation === "body" && baseRequest.body) {
      try {
        const bodyObj = JSON.parse(baseRequest.body)
        bodyObj[targetParam] = payload.value
        fuzzedRequest.body = JSON.stringify(bodyObj)
      } catch {
        // If body is not JSON, replace the entire body
        fuzzedRequest.body = String(payload.value)
      }
    }

    return fuzzedRequest
  }
}

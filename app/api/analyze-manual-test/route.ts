import { type NextRequest, NextResponse } from "next/server"

async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(JSON.stringify(errorData))
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

function extractJsonFromMarkdown(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  return text.trim()
}

export async function POST(request: NextRequest) {
  try {
    const testData = await request.json()
    const { request: testRequest, response: testResponse } = testData

    const prompt = `You are an API Security Expert analyzing a single API endpoint test in MANUAL MODE.

TEST DETAILS:
Endpoint: ${testRequest.method} ${testRequest.url}

REQUEST SENT:
Headers: ${JSON.stringify(testRequest.headers, null, 2)}
${testRequest.queryParams ? `Query Parameters: ${JSON.stringify(testRequest.queryParams, null, 2)}` : ""}
${testRequest.body ? `Body: ${testRequest.body}` : "Body: (none)"}

ACTUAL RESPONSE RECEIVED:
Status Code: ${testResponse.status} ${testResponse.statusText}
Headers: ${JSON.stringify(testResponse.headers, null, 2)}
Body: ${testResponse.body}

YOUR TASK - MANUAL MODE ANALYSIS:

1. CURRENT FINDINGS: Analyze this single request-response pair for vulnerabilities:
   - Information disclosure (verbose errors, stack traces, sensitive data)
   - Missing security headers (CORS, CSP, X-Frame-Options, etc.)
   - Authentication/authorization issues
   - Injection vulnerability indicators
   - Rate limiting issues
   - Security misconfigurations

2. RECOMMENDED FOLLOW-UP TESTS: Based on the endpoint structure, parameters, and response, suggest 3-5 specific tests the user should try next:
   - Provide exact payloads to test
   - Explain WHY each test is important
   - Specify what vulnerability each test checks for
   - Include the test type (SQL injection, BOLA, XSS, etc.)

3. POTENTIAL VULNERABILITIES: Hypothesize what vulnerabilities might exist based on:
   - The endpoint naming and structure
   - Parameter types and names
   - Response patterns
   - HTTP methods used
   - Provide likelihood assessment (high/medium/low)
   - Suggest specific testing approaches

Return a JSON object matching this EXACT structure:
{
  "scan_id": "manual-test-[random-id]",
  "timestamp": "[current ISO timestamp]",
  "api_name": "[extract from URL or 'Manual Test']",
  "overall_risk_score": "critical|high|medium|low|info",
  "endpoints_scanned": 1,
  "vulnerabilities_found": [number],
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "title": "string",
      "severity": "critical|high|medium|low|info",
      "description": "detailed explanation",
      "affected_endpoints": ["${testRequest.method} ${testRequest.url}"],
      "proof_of_concept": "actual request/response demonstrating the issue",
      "remediation": "specific fix steps",
      "cwe_id": "CWE-XXX (optional)",
      "cvss_score": 0-10 (optional)
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "recommendations": [
    "general security recommendations"
  ],
  "recommendedTests": [
    {
      "description": "Test SQL injection in user_id parameter",
      "payload": "' OR '1'='1",
      "reasoning": "The endpoint accepts a user_id parameter which might be vulnerable to SQL injection",
      "testType": "SQL Injection"
    }
  ],
  "potentialVulnerabilities": [
    {
      "type": "Broken Object Level Authorization (BOLA)",
      "likelihood": "high|medium|low",
      "testApproach": "Try changing the user_id to another user's ID",
      "reasoning": "The endpoint returns user-specific data without apparent authorization checks"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON
- NO markdown code blocks
- NO explanations outside JSON
- Include 3-5 recommendedTests
- Include 2-4 potentialVulnerabilities
- Be specific and actionable in recommendations`

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Google Gemini API key not configured",
          details: "Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Using custom Google Gemini API key for manual test analysis")

    const text = await callGeminiAPI(apiKey, prompt)
    const cleanedText = extractJsonFromMarkdown(text)
    console.log("[v0] Cleaned response text:", cleanedText.substring(0, 200))

    const report = JSON.parse(cleanedText)
    return NextResponse.json(report)
  } catch (error) {
    console.error("[v0] Manual test analysis error:", error)

    let errorMessage = "Failed to analyze test results"
    const errorDetails = error instanceof Error ? error.message : String(error)
    let activationUrl = ""

    if (
      errorDetails.includes("Generative Language API has not been used") ||
      errorDetails.includes("SERVICE_DISABLED") ||
      errorDetails.includes("PERMISSION_DENIED")
    ) {
      errorMessage = "Google Generative Language API is not enabled"

      const urlMatch = errorDetails.match(
        /https:\/\/console\.developers\.google\.com\/apis\/api\/generativelanguage\.googleapis\.com\/overview\?project=\d+/,
      )
      if (urlMatch) {
        activationUrl = urlMatch[0]
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        activationUrl,
        isApiDisabled: errorMessage.includes("not enabled"),
      },
      { status: 500 },
    )
  }
}

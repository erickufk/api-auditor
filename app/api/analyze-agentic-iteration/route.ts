import { type NextRequest, NextResponse } from "next/server"

function extractJsonFromMarkdown(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  return text.trim()
}

function cleanJsonString(jsonStr: string): string {
  // Remove any leading/trailing whitespace
  let cleaned = jsonStr.trim()

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1")

  // Remove comments (// and /* */)
  cleaned = cleaned.replace(/\/\/.*$/gm, "")
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "")

  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const {
      request: testRequest,
      response: testResponse,
      previousIterations,
      aggressiveness,
      iterationNumber,
    } = await request.json()

    const aggressivenessPrompts = {
      low: "Use conservative, safe test payloads that are unlikely to cause issues.",
      medium: "Use balanced test payloads that thoroughly test security without being overly aggressive.",
      high: "Use aggressive test payloads including advanced injection techniques, fuzzing, and boundary testing.",
    }

    const previousContext =
      previousIterations.length > 0
        ? `\n\nPrevious iterations:\n${previousIterations
            .map(
              (iter: any) =>
                `Iteration ${iter.iterationNumber}: ${iter.request.method} ${iter.request.url}\nFindings: ${iter.vulnerabilitiesFound.length} vulnerabilities\nReasoning: ${iter.reasoning}`,
            )
            .join("\n\n")}`
        : ""

    const prompt = `You are an expert API security testing agent. You are conducting iteration ${iterationNumber} of an autonomous security audit.

**Current Request:**
Method: ${testRequest.method}
URL: ${testRequest.url}
Headers: ${JSON.stringify(testRequest.headers, null, 2)}
${testRequest.body ? `Body: ${testRequest.body}` : ""}

**Response Received:**
Status: ${testResponse.status} ${testResponse.statusText}
Headers: ${JSON.stringify(testResponse.headers, null, 2)}
Body: ${testResponse.body.substring(0, 2000)}${testResponse.body.length > 2000 ? "... (truncated)" : ""}

${previousContext}

**Your Task:**
1. Analyze this response for security vulnerabilities (SQL injection, XSS, BOLA, authentication bypass, rate limiting, error disclosure, etc.)
2. Identify any vulnerabilities found with detailed proof of concept
3. Generate 2-3 specific follow-up tests to explore further (you can test different endpoints, modify auth, inject payloads, fuzz inputs, etc.)
4. Decide whether to continue testing or stop

**Testing Guidelines:**
- ${aggressivenessPrompts[aggressiveness]}
- You can test related endpoints (e.g., if testing /api/users/1, try /api/users/2, /api/users/admin, etc.)
- You can modify or remove authentication headers to test auth bypass
- You can inject common attack payloads (SQLi, XSS, command injection, etc.)
- You can test different HTTP methods on the same endpoint
- Look for patterns in responses that suggest vulnerabilities
- Consider business logic flaws, not just technical vulnerabilities

Return a JSON object with this EXACT structure:
{
  "analysis": "string (detailed analysis of the response)",
  "vulnerabilitiesFound": [
    {
      "id": "string (e.g., 'VULN-001')",
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
  "followUpTests": [
    {
      "description": "string (what this test checks)",
      "method": "string (HTTP method)",
      "url": "string (full URL)",
      "headers": { "key": "value" },
      "body": "string (optional)",
      "reasoning": "string (why this test is important)"
    }
  ],
  "shouldContinue": boolean,
  "reasoning": "string (reasoning for continue/stop decision)"
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks, no additional text.`

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set")
    }

    console.log("[v0] Making direct request to Google Gemini API")

    const geminiResponse = await fetch(
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
            maxOutputTokens: 4000,
          },
        }),
      },
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error("[v0] Gemini API error:", errorData)
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
    }

    const geminiData = await geminiResponse.json()
    console.log("[v0] Gemini API response received")

    // Extract text from Gemini response structure
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error("No text content in Gemini response")
    }

    console.log("[v0] Extracting JSON from response")
    const cleanedText = extractJsonFromMarkdown(responseText)

    let analysis
    try {
      // First try: parse as-is
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.log("[v0] Initial JSON parse failed, attempting to clean and retry")
      console.log("[v0] Raw response text:", cleanedText.substring(0, 500))

      try {
        // Second try: clean common JSON issues
        const cleanedJson = cleanJsonString(cleanedText)
        analysis = JSON.parse(cleanedJson)
      } catch (secondError) {
        console.error("[v0] JSON parsing failed after cleaning:", secondError)
        console.error("[v0] Problematic JSON:", cleanedText.substring(0, 1000))

        return NextResponse.json({
          analysis: "Failed to parse AI response. The response may have been malformed.",
          vulnerabilitiesFound: [],
          followUpTests: [],
          shouldContinue: false,
          reasoning: "Stopped due to JSON parsing error in AI response",
          error: secondError instanceof Error ? secondError.message : String(secondError),
        })
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[v0] Agentic analysis error:", error)

    let errorMessage = "Failed to analyze iteration"
    const errorDetails = error instanceof Error ? error.message : String(error)

    if (
      errorDetails.includes("Generative Language API has not been used") ||
      errorDetails.includes("SERVICE_DISABLED") ||
      errorDetails.includes("PERMISSION_DENIED")
    ) {
      errorMessage = "Google Generative Language API is not enabled"
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

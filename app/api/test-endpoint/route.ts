import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, body } = await request.json()

    console.log(`[v0] Testing endpoint: ${method} ${url}`)
    console.log(`[v0] Request headers:`, headers)

    // Make the actual HTTP request
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        "User-Agent": "API-Security-Auditor/1.0",
      },
      body: body ? body : undefined,
    })

    // Capture response details
    const responseBody = await response.text()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const statusCategory = response.status >= 200 && response.status < 300 ? "success" : "non-2xx"
    console.log(
      `[v0] Test completed: ${method} ${url} → ${response.status} ${response.statusText} (${statusCategory} - valid test result)`,
    )

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    })
  } catch (error) {
    console.error("[v0] Network error during test request:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Network failure",
      },
      { status: 500 },
    )
  }
}

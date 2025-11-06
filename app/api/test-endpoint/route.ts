import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, body } = await request.json()

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

    if (!response.ok) {
      console.log(
        `[v0] Test result: ${method} ${url} returned ${response.status} - This is a valid test result for security analysis`,
      )
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    })
  } catch (error) {
    console.error("[v0] Error making test request:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to make request",
      },
      { status: 500 },
    )
  }
}

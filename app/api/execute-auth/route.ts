import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method = "GET", headers = {}, requestBody } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`[v0] Executing ${method} request to: ${url}`)
    console.log(`[v0] Headers:`, JSON.stringify(headers, null, 2))
    if (requestBody) {
      console.log(`[v0] Request body:`, JSON.stringify(requestBody).substring(0, 500))
    }

    const startTime = Date.now()

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }

    if (method !== "GET" && method !== "HEAD" && requestBody !== undefined) {
      fetchOptions.body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody)
    }

    // Make the actual request to the external API
    const response = await fetch(url, fetchOptions)

    const responseTime = Date.now() - startTime

    // Get response body
    let responseBody: any
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      try {
        responseBody = await response.json()
      } catch {
        responseBody = await response.text()
      }
    } else {
      responseBody = await response.text()
    }

    // Collect response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    console.log(`[v0] Response: ${response.status} ${response.statusText} (${responseTime}ms)`)

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      ok: response.ok,
      responseTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Request execution error:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to execute request",
        errorType: error.name || "UnknownError",
        status: 0,
        ok: false,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }, // Return 200 so the client can handle the error
    )
  }
}

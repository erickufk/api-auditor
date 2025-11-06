import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method = "POST", headers = {}, requestBody } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`[v0] Proxying ${method} request to: ${url}`)

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }

    // Add body for POST/PUT/PATCH requests
    if (method !== "GET" && method !== "HEAD" && requestBody) {
      fetchOptions.body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody)
    }

    // Make the actual request to the external API
    const response = await fetch(url, fetchOptions)

    // Get response body
    let responseBody: any
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      responseBody = await response.json()
    } else {
      responseBody = await response.text()
    }

    // Collect response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    if (response.ok) {
      console.log(`[v0] API response: ${response.status} ${response.statusText}`)
    } else {
      console.log(`[v0] API returned non-success status: ${response.status} ${response.statusText}`)
    }

    // Return the response with all details
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      ok: response.ok,
    })
  } catch (error: any) {
    console.error("[v0] Auth proxy error:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to execute request",
        status: 0,
        ok: false,
      },
      { status: 200 }, // Return 200 so the client can handle the error
    )
  }
}

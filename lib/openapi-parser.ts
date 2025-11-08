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

export function parseOpenAPISpec(fileContent: string): ParsedOpenAPISpec {
  try {
    const spec = JSON.parse(fileContent)

    // Extract base URL
    let baseUrl = ""
    if (spec.servers && spec.servers.length > 0) {
      baseUrl = spec.servers[0].url
    } else if (spec.host) {
      // OpenAPI 2.0 (Swagger)
      const scheme = spec.schemes?.[0] || "https"
      baseUrl = `${scheme}://${spec.host}${spec.basePath || ""}`
    }

    // Extract endpoints
    const endpoints: ParsedEndpoint[] = []
    const paths = spec.paths || {}

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods = ["get", "post", "put", "patch", "delete", "options", "head"]

      for (const method of methods) {
        const operation = (pathItem as any)[method]
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            security: operation.security,
          })
        }
      }
    }

    return {
      title: spec.info?.title || "API",
      version: spec.info?.version || "1.0.0",
      baseUrl,
      endpoints,
    }
  } catch (error) {
    console.error("[v0] Failed to parse OpenAPI spec:", error)
    throw new Error("Invalid OpenAPI specification format")
  }
}

export function buildEndpointUrl(baseUrl: string, path: string, pathParams?: Record<string, string>): string {
  let cleanBaseUrl = baseUrl.trim()

  // If baseUrl is empty or invalid, throw an error
  if (!cleanBaseUrl) {
    throw new Error(
      'Base URL is required but not provided in OpenAPI specification. Please ensure the spec includes a "servers" section with a valid URL.',
    )
  }

  // Remove trailing slash from baseUrl if present
  cleanBaseUrl = cleanBaseUrl.replace(/\/$/, "")

  // Ensure path starts with /
  let cleanPath = path
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath
  }

  let url = cleanBaseUrl + cleanPath

  // Replace path parameters
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, value)
    }
  }

  return url
}

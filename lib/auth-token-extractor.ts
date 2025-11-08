/**
 * Extracts a value from a nested object using dot notation path
 * @param obj - The object to extract from
 * @param path - The path in dot notation (e.g., "data.token", "result.access_token")
 * @returns The extracted value as a string, or null if not found
 */
export function extractTokenFromPath(obj: any, path: string): string | null {
  if (!path || !obj) return null

  try {
    const keys = path.split(".")
    let value = obj

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key]
      } else {
        return null
      }
    }

    // Convert to string if it's not already
    return typeof value === "string" ? value : value !== null && value !== undefined ? String(value) : null
  } catch (error) {
    console.error("[v0] Error extracting token from path:", error)
    return null
  }
}

/**
 * Attempts to auto-detect and extract common token fields from a response object
 * @param obj - The response object
 * @returns The extracted token or null
 */
export function autoDetectToken(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null

  const commonPaths = [
    "token",
    "access_token",
    "accessToken",
    "bearer_token",
    "auth_token",
    "authToken",
    "jwt",
    "data.token",
    "data.access_token",
    "data.accessToken",
    "result.token",
    "result.access_token",
    "response.token",
    "response.access_token",
  ]

  for (const path of commonPaths) {
    const extracted = extractTokenFromPath(obj, path)
    if (extracted) {
      console.log(`[v0] Auto-detected token at path: ${path}`)
      return extracted
    }
  }

  return null
}

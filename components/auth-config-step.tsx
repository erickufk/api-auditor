"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AuthConfig, AuthMethod } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { toast } from "@/hooks/use-toast"

interface AuthConfigStepProps {
  onNext: (authConfig: AuthConfig) => void
  onBack: () => void
  initialData?: AuthConfig
}

export function AuthConfigStep({ onNext, onBack, initialData }: AuthConfigStepProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(initialData?.method || "none")

  const [needsLogin, setNeedsLogin] = useState(!!initialData?.loginEndpoint)
  const [loginEndpoint, setLoginEndpoint] = useState(initialData?.loginEndpoint || "")
  const [loginMethod, setLoginMethod] = useState<"POST" | "GET">(initialData?.loginMethod || "POST")
  const [loginBody, setLoginBody] = useState(initialData?.loginBody || "")
  const [loginHeaders, setLoginHeaders] = useState<Record<string, string>>({})

  const [rawRequest, setRawRequest] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [authResponse, setAuthResponse] = useState<any>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const [useRawRequest, setUseRawRequest] = useState(false)

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationEndpoint, setVerificationEndpoint] = useState("")
  const [verificationRawRequest, setVerificationRawRequest] = useState("")
  const [useVerificationRawRequest, setUseVerificationRawRequest] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    status: number
    message: string
    data?: any
  } | null>(null)

  const [tokenExtractionPath, setTokenExtractionPath] = useState(initialData?.tokenExtractionPath || "")
  const [extractedToken, setExtractedToken] = useState<string>("")

  const [token, setToken] = useState(initialData?.token || "")
  const [apiKey, setApiKey] = useState(initialData?.apiKey || "")
  const [apiKeyLocation, setApiKeyLocation] = useState<"header" | "query">(initialData?.apiKeyLocation || "header")
  const [apiKeyName, setApiKeyName] = useState(initialData?.apiKeyName || "X-API-Key")
  const [username, setUsername] = useState(initialData?.username || "")
  const [password, setPassword] = useState(initialData?.password || "")
  const [clientId, setClientId] = useState(initialData?.clientId || "")
  const [clientSecret, setClientSecret] = useState(initialData?.clientSecret || "")
  const [tokenEndpoint, setTokenEndpoint] = useState(initialData?.tokenEndpoint || "")
  const [accessToken, setAccessToken] = useState(initialData?.accessToken || "")

  const extractValueFromPath = (obj: any, path: string): string | null => {
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

      return typeof value === "string" ? value : String(value)
    } catch (error) {
      console.error("[v0] Error extracting value from path:", error)
      return null
    }
  }

  const parseRawRequest = (raw: string) => {
    try {
      const trimmed = raw.trim()

      if (trimmed.toLowerCase().startsWith("curl")) {
        return parseCurlCommand(trimmed)
      }

      const methodMatch = trimmed.match(/^(GET|POST|PUT|DELETE|PATCH)\s+/i)
      if (!methodMatch) {
        throw new Error("Invalid request format. Expected: curl command or METHOD URL")
      }

      const method = methodMatch[1].toUpperCase()
      const urlPart = trimmed.substring(methodMatch[0].length).trim()
      const url = urlPart.split(/\s+/)[0]

      return { url, method, body: "", headers: {} }
    } catch (error: any) {
      throw new Error(error.message || "Failed to parse request")
    }
  }

  const parseCurlCommand = (curlCmd: string) => {
    const cleanedCmd = curlCmd
      .replace(/\\\s*\n\s*/g, " ") // Remove backslash line continuations
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    console.log("[v0] Cleaned cURL command:", cleanedCmd)

    let url = ""
    let method = "POST" // Default to POST for auth requests
    let body = ""
    const headers: Record<string, string> = {}

    // First extract method if present
    const methodMatch = cleanedCmd.match(/-X\s+['"]?(GET|POST|PUT|DELETE|PATCH)['"]?/i)
    if (methodMatch) {
      method = methodMatch[1].toUpperCase()
    }

    // Try to find URL - look for http(s):// in single quotes after curl command
    let urlMatch = cleanedCmd.match(/curl[^h]*(https?:\/\/[^\s'"]+)/)
    if (urlMatch && urlMatch[1]) {
      url = urlMatch[1].replace(/['"]/g, "") // Remove any quotes
    } else {
      // Try with quotes - match URL within quotes, skipping any -X METHOD before it
      urlMatch = cleanedCmd.match(/curl(?:\s+-X\s+['"]?\w+['"]?)?\s+['"]([^'"]+)['"]/)
      if (urlMatch && urlMatch[1]) {
        // Make sure it's actually a URL
        if (urlMatch[1].startsWith("http://") || urlMatch[1].startsWith("https://")) {
          url = urlMatch[1]
        }
      }
    }

    // If still no URL, try one more pattern: look for any http(s):// URL
    if (!url) {
      urlMatch = cleanedCmd.match(/(https?:\/\/[^\s'"]+)/)
      if (urlMatch && urlMatch[1]) {
        url = urlMatch[1]
      }
    }

    const headerMatches = cleanedCmd.matchAll(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/gi)
    for (const match of headerMatches) {
      headers[match[1].trim()] = match[2].trim()
    }

    const dataMatch = cleanedCmd.match(/(?:--data(?:-raw)?|-d)\s+['"](.+?)['"]\s*(?:-|$)/s)
    if (dataMatch) {
      body = dataMatch[1]
        .replace(/\s+/g, " ") // Normalize whitespace in JSON
        .trim()
    }

    if (!url || !url.startsWith("http")) {
      throw new Error(
        "Could not extract valid URL from cURL command. Make sure the URL starts with http:// or https://",
      )
    }

    console.log("[v0] Parsed cURL:", { url, method, body, headers })

    return { url, method, body, headers }
  }

  const executeAuthRequest = async () => {
    setIsExecuting(true)
    setAuthError(null)
    setAuthResponse(null)

    try {
      let endpoint = loginEndpoint
      let method = loginMethod
      let requestBody = undefined
      let requestHeaders = { ...loginHeaders }

      if (rawRequest.trim()) {
        const parsed = parseRawRequest(rawRequest)
        endpoint = parsed.url
        method = parsed.method as "POST" | "GET"
        requestHeaders = { ...requestHeaders, ...parsed.headers }

        setLoginEndpoint(parsed.url)
        setLoginMethod(method)
        setLoginHeaders(parsed.headers)

        if (parsed.body && parsed.body.trim()) {
          setLoginBody(parsed.body)
          try {
            requestBody = JSON.parse(parsed.body)
          } catch (e) {
            requestBody = parsed.body
          }
        }

        console.log("[v0] Executing auth request:", { endpoint, method, body: requestBody, headers: requestHeaders })
      } else if (loginBody && loginBody.trim()) {
        try {
          requestBody = JSON.parse(loginBody)
        } catch (e) {
          throw new Error("Invalid JSON in request body")
        }
      }

      if (!endpoint) {
        throw new Error("Login endpoint is required")
      }

      const proxyResponse = await fetch("/api/execute-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: endpoint,
          method: method,
          requestBody,
          headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
        }),
      })

      const proxyData = await proxyResponse.json()

      if (proxyData.status === 0 && proxyData.error) {
        throw new Error(proxyData.error)
      }

      const data = proxyData.body
      setAuthResponse(data)

      if (proxyData.ok) {
        const extractedToken =
          data.token || data.access_token || data.accessToken || data.bearer_token || data.auth_token
        if (extractedToken) {
          setToken(extractedToken)
          toast({
            title: "Token extracted",
            description: "Authentication token has been automatically extracted from the response",
          })
        }

        toast({
          title: "Authentication successful",
          description: `Status: ${proxyData.status} ${proxyData.statusText}`,
        })
      } else {
        toast({
          title: "API Response Received",
          description: `Status: ${proxyData.status} ${proxyData.statusText}. Check the response below for details.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setAuthError(error.message || "Failed to execute authentication request")
      toast({
        title: "Request failed",
        description: error.message || "Failed to execute authentication request",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const verifyToken = async () => {
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      let url = verificationEndpoint
      let method = "GET"
      let requestHeaders: Record<string, string> = {}
      let requestBody: any = undefined

      if (verificationRawRequest.trim()) {
        const parsed = parseRawRequest(verificationRawRequest)
        url = parsed.url
        method = parsed.method
        requestHeaders = { ...parsed.headers }

        if (parsed.body && parsed.body.trim()) {
          try {
            requestBody = JSON.parse(parsed.body)
          } catch (e) {
            requestBody = parsed.body
          }
        }

        setVerificationEndpoint(parsed.url)
      } else {
        if (!verificationEndpoint) {
          setVerificationResult({
            success: false,
            status: 0,
            message: "Please provide either a verification cURL command or an endpoint URL",
          })
          setIsVerifying(false)
          return
        }

        if (authMethod === "bearer" && token) {
          requestHeaders["Authorization"] = `Bearer ${token}`
        } else if (authMethod === "api-key" && apiKey) {
          if (apiKeyLocation === "header") {
            requestHeaders[apiKeyName] = apiKey
          }
        } else if (authMethod === "basic" && username && password) {
          requestHeaders["Authorization"] = `Basic ${btoa(`${username}:${password}`)}`
        } else if (authMethod === "oauth2" && accessToken) {
          requestHeaders["Authorization"] = `Bearer ${accessToken}`
        }

        if (authMethod === "api-key" && apiKeyLocation === "query" && apiKey) {
          const separator = url.includes("?") ? "&" : "?"
          url = `${url}${separator}${apiKeyName}=${encodeURIComponent(apiKey)}`
        }
      }

      console.log("[v0] Verifying token with:", { url, method, headers: requestHeaders, body: requestBody })

      const proxyResponse = await fetch("/api/execute-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          method,
          requestBody,
          headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
        }),
      })

      const proxyData = await proxyResponse.json()
      const data = proxyData.body || {}
      const success = proxyData.ok
      const status = proxyData.status

      if (tokenExtractionPath && data) {
        const extracted = extractValueFromPath(data, tokenExtractionPath)
        if (extracted) {
          setExtractedToken(extracted)

          // Auto-apply the extracted token based on auth method
          if (authMethod === "bearer") {
            setToken(extracted)
          } else if (authMethod === "oauth2") {
            setAccessToken(extracted)
          }

          toast({
            title: "Token extracted!",
            description: `Successfully extracted token from path: ${tokenExtractionPath}`,
          })
        } else {
          toast({
            title: "Extraction failed",
            description: `Could not find value at path: ${tokenExtractionPath}`,
            variant: "destructive",
          })
        }
      }

      let message = ""
      let isAuthWorking = false

      if (success) {
        message = "✅ Authentication verified successfully! Your credentials are valid and working."
        isAuthWorking = true
      } else if (status === 401) {
        message =
          "❌ Authentication failed (401 Unauthorized). The credentials are invalid or expired. Please check your token/credentials and try again."
        isAuthWorking = false
      } else if (status === 404) {
        message =
          "✅ Authentication successful! The endpoint returned 404 (not found), which means your credentials are valid. The resource simply doesn't exist at this URL, but authentication is working correctly."
        isAuthWorking = true
      } else if (status === 403) {
        message =
          "⚠️ Authentication successful but access forbidden (403). Your credentials are valid, but they lack permission for this specific resource. Try a different endpoint or check your access level."
        isAuthWorking = true
      } else {
        message = `Status ${status}: ${proxyData.statusText}. ${
          status >= 400 && status < 500
            ? "This appears to be a client error. Check your request and credentials."
            : status >= 500
              ? "Server error - the API may be experiencing issues."
              : "Check the response data below for details."
        }`
        isAuthWorking = status === 403
      }

      setVerificationResult({
        success: isAuthWorking,
        status,
        message,
        data,
      })

      toast({
        title: isAuthWorking ? "✓ Authentication Working" : "✗ Authentication Failed",
        description: isAuthWorking
          ? status === 404
            ? "Credentials are valid (404 just means resource not found)"
            : status === 403
              ? "Credentials valid but lack permission for this endpoint"
              : "Your authentication is properly configured"
          : status === 401
            ? "Invalid or expired credentials"
            : `Request failed with status ${status}`,
        variant: isAuthWorking ? "default" : "destructive",
      })
    } catch (error: any) {
      console.error("[v0] Verification error:", error)
      setVerificationResult({
        success: false,
        status: 0,
        message: error.message || "Network error occurred while verifying authentication",
      })
      toast({
        title: "Network error",
        description: error.message || "Could not connect to the API",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const authConfig: AuthConfig = {
      method: authMethod,
      ...(needsLogin && { loginEndpoint, loginMethod, loginBody }),
      ...(tokenExtractionPath && { tokenExtractionPath }),
      ...(authMethod === "bearer" && { token }),
      ...(authMethod === "api-key" && { apiKey, apiKeyLocation, apiKeyName }),
      ...(authMethod === "basic" && { username, password }),
      ...(authMethod === "oauth2" && { clientId, clientSecret, tokenEndpoint, accessToken }),
    }

    onNext(authConfig)
  }

  const { t } = useLanguage()

  const canVerify =
    authMethod !== "none" &&
    (verificationRawRequest.trim() || verificationEndpoint) &&
    (verificationRawRequest.trim() ||
      (authMethod === "bearer" && token) ||
      (authMethod === "api-key" && apiKey) ||
      (authMethod === "basic" && username && password) ||
      (authMethod === "oauth2" && accessToken))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-4xl">🔒</span>
          </div>
        </div>
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">{t("authConfig")}</h2>
        <p className="text-pretty text-muted-foreground">{t("authOptional")}</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex gap-2">
              <span className="text-xl shrink-0">💡</span>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Security Testing Tip</p>
                <p className="text-xs text-muted-foreground">
                  Testing without authentication (selecting "No Authentication") is a valid security testing approach.
                  The auditor will attempt to access endpoints and analyze 401/403 responses to identify authentication
                  weaknesses, exposed endpoints, and information leakage.
                </p>
                <p className="text-xs text-muted-foreground">
                  If you configure authentication, the auditor will test with valid credentials to find authorization
                  issues, privilege escalation, and other vulnerabilities.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-accent/50 bg-accent/5 p-4">
            <div className="mb-3 flex gap-2">
              <span className="text-xl shrink-0">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t("loginFlow")}</p>
                <p className="text-xs text-muted-foreground">{t("loginFlowDesc")}</p>
              </div>
            </div>
            <Button
              type="button"
              variant={needsLogin ? "default" : "outline"}
              size="sm"
              onClick={() => setNeedsLogin(!needsLogin)}
            >
              {t("enableLogin")}
            </Button>
          </div>

          {needsLogin && (
            <Card className="border-accent/30 bg-accent/5 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="text-lg">⚠️</span>
                {t("loginFlow")}
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="raw-request">Raw Request / cURL (Optional)</Label>
                  <Textarea
                    id="raw-request"
                    placeholder={`curl -X 'POST' \\\n  'https://vbank.open.bankingapi.ru/auth/bank-token?client_id=team200&client_secret=1zL6sQrJImrxblTHfnOZ1Gty1v1NrGsH' \\\n  -H 'accept: application/json' \\\n  -d ''`}
                    value={rawRequest}
                    onChange={(e) => {
                      setRawRequest(e.target.value)
                      setUseRawRequest(e.target.value.trim().length > 0)
                    }}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste cURL command or raw request (e.g., POST https://api.example.com/auth)
                  </p>
                </div>

                {!useRawRequest && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="login-endpoint">{t("loginEndpoint")} *</Label>
                      <Input
                        id="login-endpoint"
                        type="url"
                        placeholder={t("loginEndpointPlaceholder")}
                        value={loginEndpoint}
                        onChange={(e) => setLoginEndpoint(e.target.value)}
                        required={needsLogin && !useRawRequest}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-method">{t("loginMethod")}</Label>
                      <Select value={loginMethod} onValueChange={(value: any) => setLoginMethod(value)}>
                        <SelectTrigger id="login-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-body">{t("requestBody")}</Label>
                      <Textarea
                        id="login-body"
                        placeholder='{"username": "user", "password": "pass"}'
                        value={loginBody}
                        onChange={(e) => setLoginBody(e.target.value)}
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="button"
                  onClick={executeAuthRequest}
                  disabled={isExecuting || (!loginEndpoint && !rawRequest.trim())}
                  className="w-full"
                  variant="secondary"
                >
                  {isExecuting ? "Executing..." : "Execute Authentication"}
                </Button>

                {authResponse && (
                  <div className="space-y-2">
                    <Label>Response</Label>
                    <div className="rounded-md bg-muted p-3">
                      <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(authResponse, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive">{authError}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-method">{t("authMethod")}</Label>
            <Select value={authMethod} onValueChange={(value) => setAuthMethod(value as AuthMethod)}>
              <SelectTrigger id="auth-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noAuth")}</SelectItem>
                <SelectItem value="bearer">{t("bearerToken")}</SelectItem>
                <SelectItem value="api-key">{t("apiKey")}</SelectItem>
                <SelectItem value="basic">{t("basicAuth")}</SelectItem>
                <SelectItem value="oauth2">{t("oauth2")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authMethod === "bearer" && (
            <div className="space-y-2">
              <Label htmlFor="bearer-token">{t("token")}</Label>
              <Input
                id="bearer-token"
                type="password"
                placeholder={t("tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          )}

          {authMethod === "api-key" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key">{t("apiKey")}</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={t("keyValuePlaceholder")}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api-key-location">{t("apiKeyLocation")}</Label>
                  <Select
                    value={apiKeyLocation}
                    onValueChange={(value) => setApiKeyLocation(value as "header" | "query")}
                  >
                    <SelectTrigger id="api-key-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">{t("header")}</SelectItem>
                      <SelectItem value="query">{t("queryParam")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key-name">{t("keyName")}</Label>
                  <Input
                    id="api-key-name"
                    placeholder={t("keyNamePlaceholder")}
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {authMethod === "basic" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  placeholder={t("usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {authMethod === "oauth2" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="access-token">{t("token")}</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder={t("tokenPlaceholder")}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
              {!accessToken && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="client-id">{t("clientId")}</Label>
                      <Input
                        id="client-id"
                        placeholder={t("clientIdPlaceholder")}
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required={!accessToken}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-secret">{t("clientSecret")}</Label>
                      <Input
                        id="client-secret"
                        type="password"
                        placeholder={t("clientSecretPlaceholder")}
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        required={!accessToken}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-endpoint">{t("tokenEndpoint")}</Label>
                    <Input
                      id="token-endpoint"
                      type="url"
                      placeholder={t("tokenEndpointPlaceholder")}
                      value={tokenEndpoint}
                      onChange={(e) => setTokenEndpoint(e.target.value)}
                      required={!accessToken}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {authMethod !== "none" && (
            <Card className="border-primary/30 bg-primary/5 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="text-lg">✓</span>
                Verify Authentication
              </h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Test your authentication by making a request to verify the token is valid and working
              </p>
              <div className="space-y-4">
                {(authMethod === "bearer" || authMethod === "oauth2") && needsLogin && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Label htmlFor="token-extraction-path" className="text-sm font-medium">
                      Token Extraction Path (Optional)
                    </Label>
                    <Input
                      id="token-extraction-path"
                      placeholder="e.g., data.token, access_token, result.auth.token"
                      value={tokenExtractionPath}
                      onChange={(e) => setTokenExtractionPath(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Specify the path to extract the token from verification response (dot notation). The extracted
                      token will be automatically used for authentication during audits.
                    </p>
                    {extractedToken && (
                      <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Token extracted successfully!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{extractedToken}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verification-raw-request">Verification cURL / Raw Request (Optional)</Label>
                  <Textarea
                    id="verification-raw-request"
                    placeholder={`curl -X 'GET' \\\n  'https://api.example.com/user/profile' \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -H 'accept: application/json'`}
                    value={verificationRawRequest}
                    onChange={(e) => {
                      setVerificationRawRequest(e.target.value)
                      setUseVerificationRawRequest(e.target.value.trim().length > 0)
                    }}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste complete cURL command with authentication headers, or configure manually below
                  </p>
                </div>

                {!useVerificationRawRequest && (
                  <div className="space-y-2">
                    <Label htmlFor="verification-endpoint">Verification Endpoint</Label>
                    <Input
                      id="verification-endpoint"
                      type="url"
                      placeholder="https://api.example.com/user/profile"
                      value={verificationEndpoint}
                      onChange={(e) => setVerificationEndpoint(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter an API endpoint to test authentication (e.g., a user profile or status endpoint)
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={verifyToken}
                  disabled={isVerifying || !canVerify}
                  className="w-full"
                  variant="secondary"
                >
                  {isVerifying ? "Verifying..." : "Verify Token"}
                </Button>

                {verificationResult && (
                  <div
                    className={`rounded-md border p-3 ${
                      verificationResult.success
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-destructive/10 border-destructive/20"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg shrink-0">{verificationResult.success ? "✓" : "✗"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium whitespace-pre-line">{verificationResult.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Status: {verificationResult.status}</p>
                      </div>
                    </div>
                    {verificationResult.data && Object.keys(verificationResult.data).length > 0 && (
                      <div className="mt-2">
                        <Label className="text-xs">Response Data:</Label>
                        <div className="rounded-md bg-muted p-2 mt-1">
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(verificationResult.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              <span className="mr-2">←</span>
              {t("back")}
            </Button>
            <Button type="submit" className="flex-1">
              {t("next")}
              <span className="ml-2">→</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

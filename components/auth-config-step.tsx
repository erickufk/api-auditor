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

  const [rawRequest, setRawRequest] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [authResponse, setAuthResponse] = useState<any>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationEndpoint, setVerificationEndpoint] = useState("")
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    status: number
    message: string
    data?: any
  } | null>(null)

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

  const parseRawRequest = (raw: string) => {
    try {
      const methodMatch = raw.match(/^(GET|POST|PUT|DELETE|PATCH)\s+/i)
      if (!methodMatch) {
        throw new Error("Invalid request format. Expected: METHOD URL")
      }

      const method = methodMatch[1].toUpperCase()
      const urlPart = raw.substring(methodMatch[0].length).trim()

      // For APIs like VBank that expect query params with empty body
      const url = urlPart.trim()

      setLoginEndpoint(url)
      setLoginMethod(method as "POST" | "GET")
      setLoginBody("") // Empty body for query parameter requests

      return { url, method, body: "" }
    } catch (error) {
      throw new Error(
        "Failed to parse request. Use format: POST https://api.example.com/auth?param1=value1&param2=value2",
      )
    }
  }

  const executeAuthRequest = async () => {
    setIsExecuting(true)
    setAuthError(null)
    setAuthResponse(null)

    try {
      if (rawRequest.trim()) {
        parseRawRequest(rawRequest)
      }

      if (!loginEndpoint) {
        throw new Error("Login endpoint is required")
      }

      let requestBody = undefined
      if (loginBody && loginBody.trim()) {
        try {
          requestBody = JSON.parse(loginBody)
        } catch (e) {
          throw new Error("Invalid JSON in request body")
        }
      }

      const proxyResponse = await fetch("/api/execute-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: loginEndpoint,
          method: loginMethod,
          requestBody, // Will be undefined if body is empty
        }),
      })

      const proxyData = await proxyResponse.json()

      // Only throw error if there's a network error (status 0) or proxy error
      if (proxyData.status === 0 && proxyData.error) {
        throw new Error(proxyData.error)
      }

      const data = proxyData.body
      setAuthResponse(data)

      if (proxyData.ok) {
        // Success response (2xx)
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
        // Non-2xx response (4xx, 5xx) - still valid, just not successful
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
      if (!verificationEndpoint) {
        throw new Error("Verification endpoint is required")
      }

      const headers: Record<string, string> = {}

      // Add authentication based on method
      if (authMethod === "bearer" && token) {
        headers["Authorization"] = `Bearer ${token}`
      } else if (authMethod === "api-key" && apiKey) {
        if (apiKeyLocation === "header") {
          headers[apiKeyName] = apiKey
        }
      } else if (authMethod === "basic" && username && password) {
        headers["Authorization"] = `Basic ${btoa(`${username}:${password}`)}`
      } else if (authMethod === "oauth2" && accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      let url = verificationEndpoint
      if (authMethod === "api-key" && apiKeyLocation === "query" && apiKey) {
        const separator = url.includes("?") ? "&" : "?"
        url = `${url}${separator}${apiKeyName}=${encodeURIComponent(apiKey)}`
      }

      const proxyResponse = await fetch("/api/execute-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          method: "GET",
          headers,
        }),
      })

      const proxyData = await proxyResponse.json()
      const data = proxyData.body || {}
      const success = proxyData.ok

      setVerificationResult({
        success,
        status: proxyData.status,
        message: success
          ? "Token verified successfully! API is ready for use."
          : `Verification failed: ${proxyData.statusText}`,
        data,
      })

      toast({
        title: success ? "Verification successful" : "Verification failed",
        description: success
          ? "Your authentication token is valid and working"
          : `Status ${proxyData.status}: ${proxyData.statusText}`,
        variant: success ? "default" : "destructive",
      })
    } catch (error: any) {
      setVerificationResult({
        success: false,
        status: 0,
        message: error.message || "Failed to verify token",
      })
      toast({
        title: "Verification error",
        description: error.message || "Failed to verify token",
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
    verificationEndpoint &&
    ((authMethod === "bearer" && token) ||
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
                  <Label htmlFor="raw-request">Raw Request (Optional)</Label>
                  <Textarea
                    id="raw-request"
                    placeholder="POST https://vbank.open.bankingapi.ru/auth/bank-token?client_id=team200&client_secret=XXX"
                    value={rawRequest}
                    onChange={(e) => setRawRequest(e.target.value)}
                    rows={2}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the full request string or configure manually below
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-endpoint">{t("loginEndpoint")} *</Label>
                  <Input
                    id="login-endpoint"
                    type="url"
                    placeholder={t("loginEndpointPlaceholder")}
                    value={loginEndpoint}
                    onChange={(e) => setLoginEndpoint(e.target.value)}
                    required={needsLogin}
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

                <Button
                  type="button"
                  onClick={executeAuthRequest}
                  disabled={isExecuting || !loginEndpoint}
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
                        <p className="text-sm font-medium">{verificationResult.message}</p>
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

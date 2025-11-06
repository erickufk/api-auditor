"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import type { ManualTestRequest, AgenticConfig } from "@/lib/types"
import { AgenticSettings } from "./agentic-settings"

interface ManualTestFormProps {
  onTestSubmit: (testData: ManualTestRequest, agenticConfig?: AgenticConfig) => void
}

type AuthType = "none" | "bearer" | "api-key" | "basic" | "oauth2"

export function ManualTestForm({ onTestSubmit }: ManualTestFormProps) {
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([])
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [authType, setAuthType] = useState<AuthType>("none")
  const [bearerToken, setBearerToken] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [apiKeyLocation, setApiKeyLocation] = useState<"header" | "query">("header")
  const [apiKeyName, setApiKeyName] = useState("X-API-Key")
  const [basicUsername, setBasicUsername] = useState("")
  const [basicPassword, setBasicPassword] = useState("")
  const [oauthToken, setOauthToken] = useState("")

  const [agenticConfig, setAgenticConfig] = useState<AgenticConfig>({
    enabled: false,
    maxIterations: 5,
    stopOnVulnerability: true,
    aggressiveness: "medium",
  })

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const buildAuthHeaders = (): Record<string, string> => {
    const authHeaders: Record<string, string> = {}

    switch (authType) {
      case "bearer":
        if (bearerToken.trim()) {
          authHeaders["Authorization"] = `Bearer ${bearerToken.trim()}`
        }
        break
      case "api-key":
        if (apiKey.trim() && apiKeyLocation === "header") {
          authHeaders[apiKeyName.trim() || "X-API-Key"] = apiKey.trim()
        }
        break
      case "basic":
        if (basicUsername.trim() && basicPassword.trim()) {
          const credentials = btoa(`${basicUsername.trim()}:${basicPassword.trim()}`)
          authHeaders["Authorization"] = `Basic ${credentials}`
        }
        break
      case "oauth2":
        if (oauthToken.trim()) {
          authHeaders["Authorization"] = `Bearer ${oauthToken.trim()}`
        }
        break
    }

    return authHeaders
  }

  const handleSubmit = async () => {
    // Validation
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter an endpoint URL",
        variant: "destructive",
      })
      return
    }

    let finalUrl = url.trim()
    if (authType === "api-key" && apiKeyLocation === "query" && apiKey.trim()) {
      const urlObj = new URL(finalUrl)
      urlObj.searchParams.set(apiKeyName.trim() || "api_key", apiKey.trim())
      finalUrl = urlObj.toString()
    }

    try {
      new URL(finalUrl)
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    // Validate JSON body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
      try {
        JSON.parse(body)
      } catch {
        toast({
          title: "Error",
          description: "Request body must be valid JSON",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    const authHeaders = buildAuthHeaders()
    const customHeaders: Record<string, string> = {}
    headers.forEach((header) => {
      if (header.key.trim() && header.value.trim()) {
        customHeaders[header.key.trim()] = header.value.trim()
      }
    })

    // Custom headers override auth headers if there's a conflict
    const finalHeaders = { ...authHeaders, ...customHeaders }

    const testData: ManualTestRequest = {
      url: finalUrl,
      method,
      headers: finalHeaders,
      body: body.trim() || undefined,
    }

    onTestSubmit(testData, agenticConfig.enabled ? agenticConfig : undefined)
  }

  const showBodyInput = ["POST", "PUT", "PATCH"].includes(method)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Manually Test a Single API Method</h2>
        <p className="text-pretty text-muted-foreground">
          Test a specific endpoint with custom parameters and analyze its security
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              type="text"
              placeholder="e.g., https://api.example.com/v1/users/123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* HTTP Method Selector */}
          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select value={method} onValueChange={setMethod} disabled={isSubmitting}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Authentication Section */}
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <Label className="text-base font-semibold">Authentication</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-type">Auth Type</Label>
              <Select
                value={authType}
                onValueChange={(value) => setAuthType(value as AuthType)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="auth-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Authentication</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bearer Token Fields */}
            {authType === "bearer" && (
              <div className="space-y-2">
                <Label htmlFor="bearer-token">Bearer Token</Label>
                <Input
                  id="bearer-token"
                  type="password"
                  placeholder="Enter your bearer token"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Will be sent as: Authorization: Bearer {"{token}"}</p>
              </div>
            )}

            {/* API Key Fields */}
            {authType === "api-key" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key-name">Key Name</Label>
                    <Input
                      id="api-key-name"
                      type="text"
                      placeholder="X-API-Key"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key-location">Location</Label>
                    <Select
                      value={apiKeyLocation}
                      onValueChange={(value) => setApiKeyLocation(value as "header" | "query")}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="api-key-location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="query">Query Parameter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {apiKeyLocation === "header"
                      ? `Will be sent as header: ${apiKeyName || "X-API-Key"}: {key}`
                      : `Will be appended to URL: ?${apiKeyName || "api_key"}={key}`}
                  </p>
                </div>
              </div>
            )}

            {/* Basic Auth Fields */}
            {authType === "basic" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="basic-username">Username</Label>
                  <Input
                    id="basic-username"
                    type="text"
                    placeholder="Enter username"
                    value={basicUsername}
                    onChange={(e) => setBasicUsername(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basic-password">Password</Label>
                  <Input
                    id="basic-password"
                    type="password"
                    placeholder="Enter password"
                    value={basicPassword}
                    onChange={(e) => setBasicPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Will be sent as: Authorization: Basic {"{base64(username:password)}"}
                </p>
              </div>
            )}

            {/* OAuth 2.0 Fields */}
            {authType === "oauth2" && (
              <div className="space-y-2">
                <Label htmlFor="oauth-token">Access Token</Label>
                <Input
                  id="oauth-token"
                  type="password"
                  placeholder="Enter your OAuth 2.0 access token"
                  value={oauthToken}
                  onChange={(e) => setOauthToken(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Will be sent as: Authorization: Bearer {"{token}"}</p>
              </div>
            )}
          </div>

          {/* Agentic Settings Section */}
          <AgenticSettings config={agenticConfig} onChange={setAgenticConfig} disabled={isSubmitting} />

          {/* Headers Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Headers (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHeader} disabled={isSubmitting}>
                <span className="mr-1">+</span>
                Add Header
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add custom headers beyond authentication. These will override auth headers if there's a conflict.
            </p>

            {headers.length > 0 && (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeHeader(index)}
                      disabled={isSubmitting}
                    >
                      <span>🗑️</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Body (Conditional) */}
          {showBodyInput && (
            <div className="space-y-2">
              <Label htmlFor="body">Request Body (JSON)</Label>
              <Textarea
                id="body"
                placeholder='{"key": "value"}'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSubmitting}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full">
            <span className="mr-2 text-xl">📨</span>
            {isSubmitting
              ? agenticConfig.enabled
                ? "Running Agentic Tests..."
                : "Running Test..."
              : agenticConfig.enabled
                ? "Start Agentic Testing"
                : "Run Single Test"}
          </Button>
        </div>
      </Card>

      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          {agenticConfig.enabled
            ? "Agentic mode will autonomously generate and execute multiple security tests, exploring the API endpoint in depth."
            : "This will make a live HTTP request to the specified endpoint and analyze the response for security vulnerabilities."}
        </p>
      </div>
    </div>
  )
}

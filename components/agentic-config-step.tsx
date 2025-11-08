"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgenticSettings } from "@/components/agentic-settings"
import type { AgenticConfig } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

interface AgenticConfigStepProps {
  onNext: (data: {
    inputType: "file" | "manual"
    fileContent?: string
    fileName?: string
    baseEndpoint?: string
    endpoint?: string
    method?: string
    headers?: Record<string, string>
    queryParams?: Record<string, string>
    body?: string
    agenticConfig: AgenticConfig
  }) => void
  onBack: () => void
}

export function AgenticConfigStep({ onNext, onBack }: AgenticConfigStepProps) {
  const [inputType, setInputType] = useState<"file" | "manual">("file")
  const [file, setFile] = useState<File | null>(null)
  const [baseEndpoint, setBaseEndpoint] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([])
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([])
  const [body, setBody] = useState("")
  const [agenticConfig, setAgenticConfig] = useState<AgenticConfig>({
    enabled: true,
    maxIterations: 5,
    stopOnVulnerability: true,
    aggressiveness: "medium",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ["application/json", "application/x-yaml", "text/yaml", "text/x-yaml"]
      const validExtensions = [".json", ".yaml", ".yml"]
      const hasValidExtension = validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext))

      if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
        toast({
          title: "Error",
          description: "Please upload a valid OpenAPI file (JSON or YAML)",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }])
  }

  const updateQueryParam = (index: number, field: "key" | "value", value: string) => {
    const newParams = [...queryParams]
    newParams[index][field] = value
    setQueryParams(newParams)
  }

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const handleNext = async () => {
    if (inputType === "file") {
      if (!file) {
        toast({
          title: "Error",
          description: "Please upload an OpenAPI specification file",
          variant: "destructive",
        })
        return
      }

      if (baseEndpoint.trim()) {
        try {
          new URL(baseEndpoint.trim())
        } catch {
          toast({
            title: "Error",
            description: "Please enter a valid base endpoint URL (e.g., https://api.example.com)",
            variant: "destructive",
          })
          return
        }
      }

      setIsLoading(true)
      try {
        const content = await file.text()
        onNext({
          inputType: "file",
          fileContent: content,
          fileName: file.name,
          baseEndpoint: baseEndpoint.trim() || undefined,
          agenticConfig,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } else {
      if (!endpoint.trim()) {
        toast({
          title: "Error",
          description: "Please enter an endpoint URL",
          variant: "destructive",
        })
        return
      }

      try {
        new URL(endpoint)
      } catch {
        toast({
          title: "Error",
          description: "Please enter a valid URL",
          variant: "destructive",
        })
        return
      }

      const headersObj = headers.reduce(
        (acc, h) => {
          if (h.key.trim()) acc[h.key.trim()] = h.value
          return acc
        },
        {} as Record<string, string>,
      )

      const queryParamsObj = queryParams.reduce(
        (acc, p) => {
          if (p.key.trim()) acc[p.key.trim()] = p.value
          return acc
        },
        {} as Record<string, string>,
      )

      onNext({
        inputType: "manual",
        endpoint: endpoint.trim(),
        method,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        queryParams: Object.keys(queryParamsObj).length > 0 ? queryParamsObj : undefined,
        body: body.trim() || undefined,
        agenticConfig,
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">{t("agenticConfig")}</h2>
        <p className="text-muted-foreground">{t("agenticModeDesc")}</p>
      </div>

      <Card className="p-6">
        <Label className="mb-4 block text-base font-semibold">{t("inputMethod")}</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setInputType("file")}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
              inputType === "file"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }`}
          >
            <span className="text-4xl">📄</span>
            <div className="text-center">
              <div className="font-semibold">{t("uploadFile")}</div>
              <div className="text-xs text-muted-foreground">{t("uploadFileDesc")}</div>
            </div>
          </button>

          <button
            onClick={() => setInputType("manual")}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
              inputType === "manual"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }`}
          >
            <span className="text-4xl">🔗</span>
            <div className="text-center">
              <div className="font-semibold">{t("singleEndpoint")}</div>
              <div className="text-xs text-muted-foreground">{t("singleEndpointDesc")}</div>
            </div>
          </button>
        </div>
      </Card>

      {inputType === "file" && (
        <>
          <Card className="p-6">
            <Label htmlFor="file-upload" className="mb-4 block text-base font-semibold">
              {t("uploadSpec")}
            </Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <span className="text-2xl text-muted-foreground">📤</span>
              </div>
              {file && (
                <div className="rounded-md bg-accent p-3 text-sm">
                  <span className="font-medium">Selected:</span> {file.name}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t("supportedFormats")}</p>
            </div>
          </Card>

          <Card className="p-6">
            <Label htmlFor="base-endpoint" className="mb-4 block text-base font-semibold">
              {t("baseEndpoint")} <span className="text-sm font-normal text-muted-foreground">({t("optional")})</span>
            </Label>
            <div className="space-y-4">
              <Input
                id="base-endpoint"
                type="url"
                placeholder="https://api.example.com"
                value={baseEndpoint}
                onChange={(e) => setBaseEndpoint(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("baseEndpointDesc")}</p>
            </div>
          </Card>
        </>
      )}

      {inputType === "manual" && (
        <>
          <Card className="p-6">
            <Label className="mb-4 block text-base font-semibold">{t("singleEndpoint")}</Label>
            <div className="space-y-4">
              <div>
                <Label htmlFor="endpoint">{t("endpointUrl")}</Label>
                <Input
                  id="endpoint"
                  type="url"
                  placeholder={t("endpointUrlPlaceholder")}
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="method">{t("httpMethod")}</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-base font-semibold">{t("queryParams")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQueryParam}>
                <span className="mr-1">+</span>
                {t("addQueryParam")}
              </Button>
            </div>
            {queryParams.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noQueryParams")}</p>
            ) : (
              <div className="space-y-3">
                {queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQueryParam(index)}>
                      <span>×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-base font-semibold">{t("headers")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                <span className="mr-1">+</span>
                {t("addHeader")}
              </Button>
            </div>
            {headers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noHeaders")}</p>
            ) : (
              <div className="space-y-3">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                      <span>×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {(method === "POST" || method === "PUT" || method === "PATCH") && (
            <Card className="p-6">
              <Label htmlFor="body" className="mb-4 block text-base font-semibold">
                {t("requestBody")}
              </Label>
              <Textarea
                id="body"
                placeholder={t("requestBodyPlaceholder")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">{t("requestBodyDesc")}</p>
            </Card>
          )}
        </>
      )}

      <AgenticSettings config={agenticConfig} onChange={setAgenticConfig} />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button onClick={handleNext} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 animate-spin">⟳</span>
              Loading...
            </>
          ) : (
            t("startTesting")
          )}
        </Button>
      </div>
    </div>
  )
}

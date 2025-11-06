"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ManualTestRequest } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface ManualConfigStepProps {
  onNext: (data: ManualTestRequest) => void
  onBack: () => void
  initialData?: ManualTestRequest
}

export function ManualConfigStep({ onNext, onBack, initialData }: ManualConfigStepProps) {
  const [url, setUrl] = useState(initialData?.url || "")
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">(
    (initialData?.method as any) || "GET",
  )
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    initialData?.headers ? Object.entries(initialData.headers).map(([key, value]) => ({ key, value })) : [],
  )
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>(
    initialData?.queryParams ? Object.entries(initialData.queryParams).map(([key, value]) => ({ key, value })) : [],
  )
  const [body, setBody] = useState(initialData?.body || "")

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...headers]
    updated[index][field] = value
    setHeaders(updated)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }])
  }

  const updateQueryParam = (index: number, field: "key" | "value", value: string) => {
    const updated = [...queryParams]
    updated[index][field] = value
    setQueryParams(updated)
  }

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter an endpoint URL",
        variant: "destructive",
      })
      return
    }

    try {
      new URL(url)
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    const headersObj: Record<string, string> = {}
    headers.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        headersObj[key.trim()] = value.trim()
      }
    })

    const queryParamsObj: Record<string, string> = {}
    queryParams.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        queryParamsObj[key.trim()] = value.trim()
      }
    })

    const requestData: ManualTestRequest = {
      url: url.trim(),
      method,
      headers: headersObj,
      queryParams: Object.keys(queryParamsObj).length > 0 ? queryParamsObj : undefined,
    }

    if (body.trim() && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestData.body = body.trim()
    }

    onNext(requestData)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Configure Manual Test</h2>
        <p className="text-muted-foreground">Enter the details for your API endpoint test</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* URL */}
          <div>
            <Label htmlFor="url">Endpoint URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/v1/users"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Method */}
          <div>
            <Label htmlFor="method">HTTP Method</Label>
            <Select value={method} onValueChange={(value: any) => setMethod(value)}>
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Query Parameters (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQueryParam}>
                <span className="mr-1">+</span>
                Add Param
              </Button>
            </div>
            <div className="space-y-2">
              {queryParams.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Parameter name"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Parameter value"
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
          </div>

          {/* Headers */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Headers (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                <span className="mr-1">+</span>
                Add Header
              </Button>
            </div>
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Header value"
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
          </div>

          {/* Body */}
          {(method === "POST" || method === "PUT" || method === "PATCH") && (
            <div>
              <Label htmlFor="body">Request Body (Optional)</Label>
              <Textarea
                id="body"
                placeholder='{"key": "value"}'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Enter JSON or other request body data</p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          <span className="mr-2">←</span>
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Start Testing
        </Button>
      </div>
    </div>
  )
}

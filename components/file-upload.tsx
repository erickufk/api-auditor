"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface FileUploadProps {
  onFileUpload: (fileName: string, fileContent: string) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ["application/json", "application/x-yaml", "text/yaml", "application/yaml"]
    const validExtensions = [".json", ".yaml", ".yml"]

    const hasValidType = validTypes.includes(file.type)
    const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidType && !hasValidExtension) {
      return "Please upload a valid OpenAPI specification file (.json, .yaml, or .yml)"
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    return null
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)

    try {
      const validationError = validateFile(file)
      if (validationError) {
        toast({
          title: "Error",
          description: validationError,
          variant: "destructive",
        })
        return
      }

      const content = await file.text()

      // Basic validation for OpenAPI content
      if (content.trim().length === 0) {
        toast({
          title: "Error",
          description: "File is empty",
          variant: "destructive",
        })
        return
      }

      // Try to parse as JSON or YAML
      try {
        if (file.name.endsWith(".json")) {
          JSON.parse(content)
        }
      } catch {
        toast({
          title: "Error",
          description: "Invalid JSON format",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `File "${file.name}" loaded successfully`,
      })
      onFileUpload(file.name, content)
    } catch (error) {
      console.error("[v0] Error processing file:", error)
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">Upload API Specification</h2>
        <p className="text-pretty text-muted-foreground">
          Upload your OpenAPI specification file to begin the security audit
        </p>
      </div>

      <Card
        className={`relative overflow-hidden border-2 border-dashed transition-all ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-12">
          <div className="flex flex-col items-center gap-6">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full transition-colors ${
                isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="text-5xl">📤</span>
            </div>

            <div className="text-center">
              <p className="mb-2 text-lg font-medium text-foreground">
                {isDragging ? "Drop your file here" : "Drag and drop your file here"}
              </p>
              <p className="text-sm text-muted-foreground">or click the button below to browse</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button size="lg" disabled={isProcessing} onClick={() => document.getElementById("file-input")?.click()}>
                <span className="mr-2 text-xl">📄</span>
                {isProcessing ? "Processing..." : "Select File"}
              </Button>

              <input
                id="file-input"
                type="file"
                accept=".json,.yaml,.yml"
                className="hidden"
                onChange={handleFileInput}
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex gap-3">
          <span className="h-5 w-5 shrink-0 text-muted-foreground">ℹ️</span>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Supported Formats</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>OpenAPI 3.0+ specification files</li>
              <li>JSON (.json) or YAML (.yaml, .yml) format</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

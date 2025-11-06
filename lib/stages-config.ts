import type { Stage } from "./types"

export const AUDIT_STAGES: Stage[] = [
  {
    id: "api_analysis",
    name: "API Documentation Analysis",
    status: "pending",
    description: "Analyzing OpenAPI specification and identifying endpoints",
  },
  {
    id: "vulnerability_testing",
    name: "Vulnerability Test Generation",
    status: "pending",
    description: "Generating security tests for common vulnerabilities",
  },
  {
    id: "auth_testing",
    name: "Authentication Testing",
    status: "pending",
    description: "Testing authentication and authorization mechanisms",
  },
  {
    id: "fuzzing_generation",
    name: "Fuzzing Test Generation",
    status: "pending",
    description: "Creating fuzzing tests for input validation",
  },
  {
    id: "business_logic_testing",
    name: "Business Logic Testing",
    status: "pending",
    description: "Analyzing business logic vulnerabilities",
  },
  {
    id: "security_report",
    name: "Generating Final Report",
    status: "pending",
    description: "Compiling comprehensive security audit report",
  },
]

export const MANUAL_TEST_STAGES: Stage[] = [
  {
    id: "sending_request",
    name: "Sending Request",
    status: "pending",
    description: "Making live HTTP request to the endpoint",
  },
  {
    id: "analyzing_response",
    name: "Analyzing Response",
    status: "pending",
    description: "Analyzing response with AI for security issues",
  },
  {
    id: "generating_report",
    name: "Generating Report",
    status: "pending",
    description: "Compiling security findings and recommendations",
  },
]

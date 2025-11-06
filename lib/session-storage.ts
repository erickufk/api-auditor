import type { ProjectMetadata, TestMode, AuthConfig, AgenticConfig, ManualTestRequest } from "./types"

const STORAGE_KEYS = {
  PROJECT_METADATA: "api-auditor-project-metadata",
  TEST_MODE: "api-auditor-test-mode",
  AUTH_CONFIG: "api-auditor-auth-config",
  AGENTIC_CONFIG: "api-auditor-agentic-config",
  MANUAL_CONFIG: "api-auditor-manual-config",
}

export const sessionStorage = {
  // Project Metadata
  saveProjectMetadata: (data: ProjectMetadata) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEYS.PROJECT_METADATA, JSON.stringify(data))
    }
  },
  getProjectMetadata: (): ProjectMetadata | null => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem(STORAGE_KEYS.PROJECT_METADATA)
      return data ? JSON.parse(data) : null
    }
    return null
  },

  // Test Mode
  saveTestMode: (mode: TestMode) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEYS.TEST_MODE, mode)
    }
  },
  getTestMode: (): TestMode | null => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem(STORAGE_KEYS.TEST_MODE) as TestMode | null
    }
    return null
  },

  // Auth Config
  saveAuthConfig: (config: AuthConfig) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEYS.AUTH_CONFIG, JSON.stringify(config))
    }
  },
  getAuthConfig: (): AuthConfig | null => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem(STORAGE_KEYS.AUTH_CONFIG)
      return data ? JSON.parse(data) : null
    }
    return null
  },

  // Agentic Config
  saveAgenticConfig: (config: AgenticConfig) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEYS.AGENTIC_CONFIG, JSON.stringify(config))
    }
  },
  getAgenticConfig: (): AgenticConfig | null => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem(STORAGE_KEYS.AGENTIC_CONFIG)
      return data ? JSON.parse(data) : null
    }
    return null
  },

  // Manual Config
  saveManualConfig: (config: ManualTestRequest) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEYS.MANUAL_CONFIG, JSON.stringify(config))
    }
  },
  getManualConfig: (): ManualTestRequest | null => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem(STORAGE_KEYS.MANUAL_CONFIG)
      return data ? JSON.parse(data) : null
    }
    return null
  },

  // Clear all
  clearAll: () => {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => {
        window.sessionStorage.removeItem(key)
      })
    }
  },
}

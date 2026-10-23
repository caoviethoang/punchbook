import { getStoredToken } from "./auth"

function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) {
    return envUrl.endsWith("/api/v1") ? envUrl : `${envUrl.replace(/\/+$/, "")}/api/v1`
  }
  return "http://localhost:3000/api/v1"
}

export const apiBaseUrl = resolveBaseUrl()

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  if (cleanPath.startsWith("/api/v1/")) {
    const rootBase = apiBaseUrl.replace(/\/api\/v1\/?$/, "")
    return `${rootBase}${cleanPath}`
  }
  return `${apiBaseUrl}${cleanPath}`
}

export interface ApiErrorResponse {
  error: string
  code: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  code: string
  details?: Record<string, unknown>

  constructor(message: string, code = "UNKNOWN_ERROR", details?: Record<string, unknown>) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.details = details
  }
}

/**
 * Returns the raw stored token string.
 * Throws if no token is stored (user not logged in).
 */
export function authToken(): string {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }
  return token
}

/**
 * Builds the Authorization + Content-Type headers for authenticated requests.
 * Throws if no token is stored (user not logged in).
 */
export function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${authToken()}`,
    "Content-Type": "application/json",
  }
}

/**
 * Parses the JSON body of a fetch Response.
 * On non-2xx status, extracts a human-readable error message and throws an ApiError.
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json()
  if (!response.ok) {
    const record = body as {
      error?: unknown
      errors?: unknown
      code?: unknown
      details?: unknown
    }
    const message =
      typeof record.error === "string"
        ? record.error
        : Array.isArray(record.errors)
          ? record.errors.join(", ")
          : "Request failed"
    const code = typeof record.code === "string" ? record.code : `HTTP_${response.status}`
    const details =
      typeof record.details === "object" && record.details !== null
        ? (record.details as Record<string, unknown>)
        : undefined

    throw new ApiError(message, code, details)
  }
  return body as T
}

/**
 * Downloads an authenticated binary resource and triggers a browser file download.
 * Reads `Content-Disposition` header for filename if available.
 */
export async function downloadBlob(path: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(resolveApiUrl(path), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    let errorMessage = "Không thể tải file."
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) errorMessage = data.error
    } catch {
      // non-JSON response body — use default message
    }
    throw new Error(errorMessage)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get("Content-Disposition")
  let filename = fallbackFilename
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/)
    if (match && match[1]) {
      filename = match[1]
    }
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function jsonHeaders(authenticated: boolean): HeadersInit {
  return authenticated ? authHeaders() : { "Content-Type": "application/json" }
}

function withQuery(path: string, query?: Record<string, string>): string {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const qs = params.toString()
  return `${resolveApiUrl(path)}${qs ? `?${qs}` : ""}`
}

export async function apiGet<T>(
  path: string,
  options?: { auth?: boolean; query?: Record<string, string>; token?: string },
): Promise<T> {
  const authenticated = options?.auth !== false
  const headers = options?.token
    ? { Authorization: `Bearer ${options.token}` }
    : jsonHeaders(authenticated)

  const response = await fetch(withQuery(path, options?.query), { headers })
  return parseApiResponse<T>(response)
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: { auth?: boolean },
): Promise<T> {
  const response = await fetch(resolveApiUrl(path), {
    method: "POST",
    headers: jsonHeaders(options?.auth !== false),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseApiResponse<T>(response)
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: { auth?: boolean },
): Promise<T> {
  const response = await fetch(resolveApiUrl(path), {
    method: "PATCH",
    headers: jsonHeaders(options?.auth !== false),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseApiResponse<T>(response)
}

export async function apiDelete<T>(path: string, options?: { auth?: boolean }): Promise<T> {
  const response = await fetch(resolveApiUrl(path), {
    method: "DELETE",
    headers: jsonHeaders(options?.auth !== false),
  })
  return parseApiResponse<T>(response)
}

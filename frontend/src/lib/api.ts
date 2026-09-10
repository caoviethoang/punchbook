import { getStoredToken } from "./auth"

const graphqlUrl =
  import.meta.env.VITE_GRAPHQL_API_URL || "http://localhost:3000/graphql"

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  graphqlUrl.replace(/\/graphql\/?$/, "")

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
 * On non-2xx status, extracts a human-readable error message and throws.
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json()
  if (!response.ok) {
    const record = body as { error?: unknown; errors?: unknown }
    const message =
      typeof record.error === "string"
        ? record.error
        : Array.isArray(record.errors)
          ? record.errors.join(", ")
          : "Request failed"
    throw new Error(message)
  }
  return body as T
}

/**
 * Downloads an authenticated binary resource and triggers a browser file download.
 * Reads `Content-Disposition` header for filename if available.
 */
export async function downloadBlob(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
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
  return authenticated
    ? authHeaders()
    : { "Content-Type": "application/json" }
}

function withQuery(path: string, query?: Record<string, string>): string {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const qs = params.toString()
  return `${apiBaseUrl}${path}${qs ? `?${qs}` : ""}`
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
  const response = await fetch(`${apiBaseUrl}${path}`, {
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
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "PATCH",
    headers: jsonHeaders(options?.auth !== false),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseApiResponse<T>(response)
}

export async function apiDelete<T>(
  path: string,
  options?: { auth?: boolean },
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "DELETE",
    headers: jsonHeaders(options?.auth !== false),
  })
  return parseApiResponse<T>(response)
}

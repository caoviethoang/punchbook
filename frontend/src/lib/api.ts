import { getStoredToken } from "./auth"

/**
 * Builds the Authorization + Content-Type headers for authenticated requests.
 * Throws if no token is stored (user not logged in).
 */
export function authHeaders(): HeadersInit {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }
  return {
    Authorization: `Bearer ${token}`,
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

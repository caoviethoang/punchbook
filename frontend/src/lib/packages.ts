import { apiBaseUrl, getStoredToken } from "./auth"

export interface PackageItem {
  id: string
  name: string
  price: number
  sessions_count: number | null
  duration_days: number | null
  created_at?: string
}

export type PackageType = "sessions" | "days"

export interface CreatePackagePayload {
  name: string
  price: number
  sessions_count?: number
  duration_days?: number
}

function authHeaders(): HeadersInit {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function parseJson<T>(response: Response): Promise<T> {
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
 * GET /packages — shop-scoped package list for membership form select.
 */
export async function listPackages(): Promise<PackageItem[]> {
  const response = await fetch(`${apiBaseUrl}/packages`, {
    headers: authHeaders(),
  })
  const body = await parseJson<{ packages: PackageItem[] }>(response)
  return body.packages
}

/**
 * POST /packages
 * Creates a new package for the current shop
 */
export async function createPackage(
  payload: CreatePackagePayload,
): Promise<PackageItem> {
  const response = await fetch(`${apiBaseUrl}/packages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ package: payload }),
  })
  return parseJson<PackageItem>(response)
}

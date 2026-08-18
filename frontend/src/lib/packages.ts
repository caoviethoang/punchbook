import { apiBaseUrl } from "./auth"
import { authHeaders, parseApiResponse } from "./api"

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

/**
 * GET /packages — shop-scoped package list for membership form select.
 */
export async function listPackages(): Promise<PackageItem[]> {
  const response = await fetch(`${apiBaseUrl}/packages`, {
    headers: authHeaders(),
  })
  const body = await parseApiResponse<{ packages: PackageItem[] }>(response)
  return body.packages
}

/**
 * POST /packages
 * Creates a new package for the current shop.
 */
export async function createPackage(
  payload: CreatePackagePayload,
): Promise<PackageItem> {
  const response = await fetch(`${apiBaseUrl}/packages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ package: payload }),
  })
  return parseApiResponse<PackageItem>(response)
}

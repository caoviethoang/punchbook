import { apiGet, apiPost } from "./api"

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

/** GET /packages — shop-scoped package list for membership form select. */
export async function listPackages(): Promise<PackageItem[]> {
  const body = await apiGet<{ packages: PackageItem[] }>("/packages")
  return body.packages
}

/** POST /packages — creates a new package for the current shop. */
export async function createPackage(
  payload: CreatePackagePayload,
): Promise<PackageItem> {
  return apiPost<PackageItem>("/packages", { package: payload })
}

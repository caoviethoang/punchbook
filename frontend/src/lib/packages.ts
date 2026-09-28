import { apiDelete, apiGet, apiPatch, apiPost } from "./api"

export interface PackageCategory {
  id: string
  shop_id: string
  name: string
}

export interface PackageItem {
  id: string
  name: string
  price: number
  sessions_count: number | null
  duration_days: number | null
  package_category_id?: string | null
  category_name?: string | null
  created_at?: string
}

export type PackageType = "sessions" | "days"

export interface CreatePackagePayload {
  name: string
  price: number
  sessions_count?: number
  duration_days?: number
  package_category_id?: string | null
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

/** PATCH /packages/:id — updates an existing package for the current shop. */
export async function updatePackage(
  id: string,
  payload: CreatePackagePayload,
): Promise<PackageItem> {
  return apiPatch<PackageItem>(`/packages/${id}`, { package: payload })
}

/** DELETE /packages/:id — soft-deletes a package for the current shop. */
export async function deletePackage(id: string): Promise<void> {
  await apiDelete(`/packages/${id}`)
}

/** GET /package_categories — lists all categories for the current shop. */
export async function listPackageCategories(): Promise<PackageCategory[]> {
  const body = await apiGet<{ categories: PackageCategory[] }>(
    "/package_categories",
  )
  return body.categories
}

/** POST /package_categories — creates or finds a category by name. */
export async function createPackageCategory(
  name: string,
): Promise<PackageCategory> {
  return apiPost<PackageCategory>("/package_categories", {
    package_category: { name },
  })
}

/** PATCH /package_categories/:id — updates category name. */
export async function updatePackageCategory(
  id: string,
  name: string,
): Promise<PackageCategory> {
  return apiPatch<PackageCategory>(`/package_categories/${id}`, {
    package_category: { name },
  })
}

/** DELETE /package_categories/:id — deletes a category. */
export async function deletePackageCategory(id: string): Promise<void> {
  await apiDelete(`/package_categories/${id}`)
}

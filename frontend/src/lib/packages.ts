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

export function formatPackageDuration(pkg: PackageItem): string {
  if (pkg.sessions_count !== null) {
    return `${pkg.sessions_count} buổi`
  }
  const days = pkg.duration_days ?? 0
  if (days === 1) return "1 ngày (Gói lẻ)"
  if (days === 30) return "30 ngày (1 tháng)"
  if (days === 60) return "60 ngày (2 tháng)"
  if (days === 90) return "90 ngày (3 tháng - Mua 3+1)"
  if (days === 180) return "180 ngày (6 tháng)"
  if (days === 365) return "365 ngày (1 năm)"
  if (days % 30 === 0) return `${days} ngày (${days / 30} tháng)`
  return `${days} ngày`
}

export function formatPackageTypeBadge(pkg: PackageItem): string {
  if (pkg.sessions_count !== null) return "Theo buổi"
  const days = pkg.duration_days ?? 0
  if (days === 1) return "Gói 1 ngày"
  if (days === 30) return "Gói 1 tháng"
  if (days === 60) return "Gói 2 tháng"
  if (days === 90) return "Gói 3 tháng"
  if (days === 180) return "Gói 6 tháng"
  if (days === 365) return "Gói 1 năm"
  if (days % 30 === 0) return `Gói ${days / 30} tháng`
  return `${days} ngày`
}


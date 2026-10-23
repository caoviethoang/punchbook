import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  authToken,
  downloadBlob,
  parseApiResponse,
  apiBaseUrl,
} from "./api"

export interface MembershipPackage {
  id: string
  name: string
  price?: number
  sessions_count?: number | null
  duration_days?: number | null
}

export interface MembershipShop {
  id: string
  name: string
  phone?: string | null
  address?: string | null
}

export interface Membership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  package: MembershipPackage
  shop?: MembershipShop
  status?: "active" | "expiring" | "expired" | "deleted"
  discarded_at?: string | null
  checked_in_today?: boolean
  last_checked_in_at?: string | null
  qr_code_value?: string
  notes?: string | null
}

export interface MembershipDetailCheckIn {
  id: string
  checked_in_at: string
  staff: {
    id: string
    name: string
  }
}

export interface MembershipDetailInvoice {
  id: string
  amount: number
  status: string
  payos_transaction_id: string | null
  payos_checkout_url: string | null
  created_at: string
}

export interface MembershipDetail extends Membership {
  status: "active" | "expiring" | "expired"
  created_at?: string
  check_ins: MembershipDetailCheckIn[]
  invoices: MembershipDetailInvoice[]
}

export interface CheckInRecord {
  id: string
  checked_in_at: string
}

export interface CheckInResult {
  membership: Membership
  check_in: CheckInRecord
}

export interface BatchCheckInItemResult {
  membership_id: string
  customer_name: string
  status: "success" | "failed"
  membership?: Membership
  check_in?: CheckInRecord
  error?: string
}

export interface BatchCheckInResult {
  total: number
  success_count: number
  failed_count: number
  results: BatchCheckInItemResult[]
}

export const EXPIRING_SESSIONS_THRESHOLD = 3
export const EXPIRING_DAYS_WINDOW = 7

/** True when the member has no sessions left or the day-based pass is past expires_at. */
export function isMembershipExhausted(
  membership: Pick<Membership, "sessions_left" | "expires_at">,
): boolean {
  if (membership.sessions_left !== null && membership.sessions_left !== undefined) {
    return membership.sessions_left <= 0
  }
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return true
  }
  return false
}

/**
 * Derives a display status from the membership's expires_at and sessions_left.
 * - Expired: sessions_left <= 0 OR expires_at is in the past
 * - Expiring: sessions_left <= 3 (and > 0) OR expires_at is within the next 7 days
 * - Active: otherwise
 */
export function computeMembershipStatus(
  membership: Pick<Membership, "sessions_left" | "expires_at"> & { status?: string; discarded_at?: string | null },
): "active" | "expiring" | "expired" | "deleted" {
  if (membership.status === "deleted" || membership.discarded_at) return "deleted"

  // Session-based
  if (membership.sessions_left !== null && membership.sessions_left !== undefined) {
    if (membership.sessions_left <= 0) return "expired"
    if (membership.sessions_left <= EXPIRING_SESSIONS_THRESHOLD) return "expiring"
  }

  // Date-based
  if (membership.expires_at) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(membership.expires_at)
    expiry.setHours(0, 0, 0, 0)

    if (expiry < today) return "expired"

    const thresholdDate = new Date(today)
    thresholdDate.setDate(thresholdDate.getDate() + EXPIRING_DAYS_WINDOW)
    if (expiry <= thresholdDate) return "expiring"
  }

  return "active"
}

export function extractMembershipIdFromQR(scannedText: string): string {
  const trimmed = scannedText.trim()
  if (trimmed.startsWith("PUNCHBOOK:")) {
    return trimmed.slice("PUNCHBOOK:".length).trim()
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      if (parsed.membership_id) return String(parsed.membership_id).trim()
      if (parsed.id) return String(parsed.id).trim()
    } catch {
      // Fallback
    }
  }
  if (trimmed.includes("/memberships/")) {
    const parts = trimmed.split("/memberships/")
    const id = parts[1]?.split("?")[0]?.split("/")[0]
    if (id) return id.trim()
  }
  return trimmed
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type StatusFilterType = "all" | "active" | "expiring" | "expired" | "not_checked_in" | "deleted"

export type CheckInFilterType = "not_checked_in" | "expiring" | "expired" | "all"

export type SortType = "name" | "checkin_priority"

export interface FetchMembershipsParams {
  query?: string
  status?: StatusFilterType
  sort?: SortType
  page?: number
  per_page?: number
}

export interface PaginatedMembershipsResult {
  memberships: Membership[]
  meta?: PaginationMeta
}

export const DEFAULT_MEMBERSHIPS_PER_PAGE = 20

/** Generates a list of page numbers and ellipsis separators for pagination controls. */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

/** GET /memberships — shop-scoped search, status filter, and pagination. */
export async function fetchMemberships(
  params: FetchMembershipsParams = {},
): Promise<PaginatedMembershipsResult> {
  const page = params.page ?? 1
  const perPage = params.per_page ?? DEFAULT_MEMBERSHIPS_PER_PAGE
  const queryParams: Record<string, string> = {
    page: page.toString(),
    per_page: perPage.toString(),
  }
  if (params.query?.trim()) queryParams.query = params.query.trim()
  if (params.status && params.status !== "all") queryParams.status = params.status
  if (params.sort && params.sort !== "name") queryParams.sort = params.sort

  return apiGet<PaginatedMembershipsResult>("/memberships", {
    query: queryParams,
  })
}

/** Legacy helper: searchMemberships calls fetchMemberships. */
export async function searchMemberships(query: string): Promise<Membership[]> {
  const res = await fetchMemberships({ query })
  return res.memberships
}

export interface CreateMembershipPayload {
  customer_name: string
  phone: string
  package_id: string
  notes?: string | null
}

export interface UpdateMembershipPayload {
  customer_name?: string
  phone?: string
  package_id?: string
  sessions_left?: number | null
  expires_at?: string | null
  notes?: string | null
}

/** POST /memberships — create member; backend inits sessions_left / expires_at from package. */
export async function createMembership(payload: CreateMembershipPayload): Promise<Membership> {
  const body = await apiPost<{ membership: Membership }>("/memberships", {
    membership: payload,
  })
  return body.membership
}

/** PATCH /memberships/:id — update member. */
export async function updateMembership(
  id: string,
  payload: UpdateMembershipPayload,
): Promise<Membership> {
  const body = await apiPatch<{ membership: Membership }>(`/memberships/${id}`, {
    membership: payload,
  })
  return body.membership
}

/** DELETE /memberships/:id — discard member. */
export async function deleteMembership(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/memberships/${id}`)
}

export interface ImportErrorDetail {
  row: number
  customer_name: string
  phone: string
  error: string
}

export interface ImportMembershipsResult {
  total_rows: number
  success_count: number
  failed_count: number
  errors: ImportErrorDetail[]
}

export interface ExportMembershipsParams {
  query?: string
  status?: StatusFilterType
}

/** GET /memberships/export — download filtered memberships as .xlsx file. */
export async function exportMemberships(params?: ExportMembershipsParams): Promise<void> {
  const searchParams = new URLSearchParams()
  if (params?.query) searchParams.set("query", params.query)
  if (params?.status && params.status !== "all") searchParams.set("status", params.status)
  const qs = searchParams.toString()
  return downloadBlob(`/memberships/export${qs ? `?${qs}` : ""}`, "memberships.xlsx")
}

/** GET /memberships/import_template — download template .xlsx file. */
export async function downloadImportTemplate(): Promise<void> {
  return downloadBlob("/memberships/import_template", "template_import_memberships.xlsx")
}

/** POST /memberships/import — upload Excel/CSV file to batch create memberships. */
export async function importMemberships(file: File): Promise<ImportMembershipsResult> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${apiBaseUrl}/memberships/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken()}`,
    },
    body: formData,
  })

  return parseApiResponse<ImportMembershipsResult>(response)
}

/**
 * POST /memberships/:id/check_in
 * staffId is optional — backend defaults to current shop staff if omitted.
 */
export async function checkIn(id: string, staffId?: string): Promise<CheckInResult> {
  return apiPost<CheckInResult>(`/memberships/${id}/check_in`, {
    staff_id: staffId || undefined,
  })
}

/**
 * POST /memberships/batch_check_in
 * Perform batch check-in for multiple members at once (e.g. group classes).
 */
export async function batchCheckIn(
  membershipIds: string[],
  staffId?: string,
): Promise<BatchCheckInResult> {
  return apiPost<BatchCheckInResult>("/memberships/batch_check_in", {
    membership_ids: membershipIds,
    staff_id: staffId || undefined,
  })
}

/** GET /memberships/:id — fetch membership detail with check-in & invoice history. */
export async function getMembershipDetail(id: string): Promise<MembershipDetail> {
  const body = await apiGet<{ membership: MembershipDetail }>(`/memberships/${id}`)
  return body.membership
}

/** POST /memberships/:id/restore — restore a soft-deleted membership */
export async function restoreMembership(
  id: string,
): Promise<{ membership: Membership; message: string }> {
  return apiPost<{ membership: Membership; message: string }>(`/memberships/${id}/restore`)
}

import { apiGet, apiPost, authToken, downloadBlob, parseApiResponse, apiBaseUrl } from "./api"

export interface MembershipPackage {
  id: string
  name: string
  price?: number
  sessions_count?: number | null
  duration_days?: number | null
}

export interface Membership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  package: MembershipPackage
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

/** True when the member has no sessions left or the day-based pass is past expires_at. */
export function isMembershipExhausted(
  membership: Pick<Membership, "sessions_left" | "expires_at">,
): boolean {
  if (membership.sessions_left === 0) return true
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return true
  }
  return false
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type StatusFilterType = "all" | "active" | "expiring" | "expired"

export interface FetchMembershipsParams {
  query?: string
  status?: StatusFilterType
  page?: number
  per_page?: number
}

export interface PaginatedMembershipsResult {
  memberships: Membership[]
  meta?: PaginationMeta
}

/** GET /memberships — shop-scoped search, status filter, and pagination. */
export async function fetchMemberships(
  params: FetchMembershipsParams = {},
): Promise<PaginatedMembershipsResult> {
  const queryParams: Record<string, string> = {}
  if (params.query?.trim()) queryParams.query = params.query.trim()
  if (params.status && params.status !== "all") queryParams.status = params.status
  if (params.page && params.page > 1) queryParams.page = params.page.toString()
  if (params.per_page && params.per_page !== 20) queryParams.per_page = params.per_page.toString()

  return apiGet<PaginatedMembershipsResult>("/memberships", {
    query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
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
}

/** POST /memberships — create member; backend inits sessions_left / expires_at from package. */
export async function createMembership(
  payload: CreateMembershipPayload,
): Promise<Membership> {
  const body = await apiPost<{ membership: Membership }>("/memberships", {
    membership: payload,
  })
  return body.membership
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

/** GET /memberships/import_template — download template .xlsx file. */
export async function downloadImportTemplate(): Promise<void> {
  return downloadBlob(
    "/memberships/import_template",
    "template_import_memberships.xlsx",
  )
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
 * staffId is required — shop JWT has no staff identity yet (see backend MembershipsController).
 */
export async function checkIn(
  id: string,
  staffId: string,
): Promise<CheckInResult> {
  return apiPost<CheckInResult>(`/memberships/${id}/check_in`, {
    staff_id: staffId,
  })
}

/** GET /memberships/:id — fetch membership detail with check-in & invoice history. */
export async function getMembershipDetail(id: string): Promise<MembershipDetail> {
  const body = await apiGet<{ membership: MembershipDetail }>(`/memberships/${id}`)
  return body.membership
}

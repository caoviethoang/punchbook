import { apiBaseUrl, apiGet, apiPost, parseApiResponse } from "./api"
import { getStoredToken } from "./auth"

export interface MembershipPackage {
  id: string
  name: string
}

export interface Membership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  package: MembershipPackage
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

/** GET /memberships?query=... — shop-scoped search (blank query returns limited list). */
export async function searchMemberships(query: string): Promise<Membership[]> {
  const trimmed = query.trim()
  const body = await apiGet<{ memberships: Membership[] }>("/memberships", {
    query: trimmed ? { query: trimmed } : undefined,
  })
  return body.memberships
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

export interface ImportRowError {
  row: number
  customer_name?: string | null
  phone?: string | null
  package_name?: string | null
  message: string
}

export interface ImportMembershipsResult {
  success: boolean
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportRowError[]
  memberships: Membership[]
}

/**
 * GET /memberships/template — downloads the binary Excel template (.xlsx).
 */
export async function downloadMembershipImportTemplate(): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }

  const response = await fetch(`${apiBaseUrl}/memberships/template`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let errorMessage = "Không thể tải file mẫu Excel."
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) errorMessage = data.error
    } catch {
      // non-JSON response
    }
    throw new Error(errorMessage)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get("Content-Disposition")
  let filename = "template_import_memberships.xlsx"
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

/**
 * POST /memberships/import — uploads an Excel/CSV file to import memberships.
 */
export async function importMemberships(
  file: File,
): Promise<ImportMembershipsResult> {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }

  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${apiBaseUrl}/memberships/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  return parseApiResponse<ImportMembershipsResult>(response)
}


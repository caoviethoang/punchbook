import { apiGet, apiPost } from "./api"

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

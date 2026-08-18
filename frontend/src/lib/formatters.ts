/**
 * Formats a number as Vietnamese Đồng currency.
 * Example: 500000 → "500.000 ₫"
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats an ISO date string into Vietnamese date format (DD/MM/YYYY).
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Returns a human-readable "remaining" label for a membership:
 * - "X buổi" for session-based
 * - Formatted date for day-based
 * - "—" when neither is set
 */
export function remainingLabel(membership: {
  sessions_left: number | null
  expires_at: string | null
}): string {
  if (membership.sessions_left !== null) {
    return `${membership.sessions_left} buổi`
  }
  if (membership.expires_at) {
    return formatDate(membership.expires_at)
  }
  return "—"
}

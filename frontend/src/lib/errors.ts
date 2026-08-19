/**
 * Maps backend/network error messages to Vietnamese user-facing strings
 * for the check-in flow.
 */
export function toCheckInError(err: unknown): string {
  const raw = err instanceof Error ? err.message : ""
  if (raw === "Membership has no sessions left") return "Hội viên đã hết buổi."
  if (raw === "Membership has expired") return "Thẻ thành viên đã hết hạn."
  if (raw === "Unauthorized" || raw === "NetworkError")
    return "Mất kết nối. Vui lòng thử lại."
  if (!raw || raw === "Request failed")
    return "Check-in thất bại. Vui lòng thử lại."
  return raw
}

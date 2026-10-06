import type { Membership } from "../../lib/memberships"

export function MemberRemainingBadge({ membership }: { membership: Membership }) {
  const sessionsCount = membership.package?.sessions_count

  if (sessionsCount !== null && sessionsCount !== undefined) {
    const rem = membership.sessions_left ?? 0
    return (
      <span className="font-medium text-indigo-700 dark:text-indigo-300">
        Còn {rem}/{sessionsCount} buổi
      </span>
    )
  }

  if (membership.expires_at) {
    const expiresAt = new Date(membership.expires_at)
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (days <= 0) {
      return (
        <span className="font-semibold text-red-600 dark:text-red-400">
          Đã hết hạn
        </span>
      )
    }
    return (
      <span className="font-medium text-emerald-700 dark:text-emerald-300">
        Còn {days} ngày
      </span>
    )
  }

  return <span className="text-slate-400">-</span>
}

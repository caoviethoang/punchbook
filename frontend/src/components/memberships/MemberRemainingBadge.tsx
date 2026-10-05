import type { Membership } from "../../lib/memberships"

export function MemberRemainingBadge({ membership }: { membership: Membership }) {
  if (membership.sessions_left !== null) {
    const isZero = membership.sessions_left === 0
    return (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
          isZero
            ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        }`}
      >
        {membership.sessions_left} buổi còn lại
      </span>
    )
  }

  if (membership.expires_at) {
    const isExpired = new Date(membership.expires_at) < new Date()
    return (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
          isExpired
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        }`}
      >
        {isExpired ? "Hết hạn" : `Hạn: ${membership.expires_at.substring(0, 10)}`}
      </span>
    )
  }

  return <span className="text-xs text-slate-400">Không giới hạn</span>
}

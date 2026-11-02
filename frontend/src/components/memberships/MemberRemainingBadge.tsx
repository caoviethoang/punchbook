import { useTranslation } from "react-i18next"
import type { Membership } from "../../lib/memberships"

export function MemberRemainingBadge({ membership }: { membership: Membership }) {
  const { t } = useTranslation()
  const sessionsCount = membership.package?.sessions_count

  if (sessionsCount !== null && sessionsCount !== undefined) {
    const rem = membership.sessions_left ?? 0
    if (rem <= 0) {
      return (
        <span className="font-semibold text-red-600 dark:text-red-400">
          {t("memberships.sessions_exhausted", "Hết buổi (0/{{total}})", { total: sessionsCount })}
        </span>
      )
    }
    if (rem <= 3) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
          {t("memberships.sessions_remaining", "Còn {{rem}}/{{total}} buổi", { rem, total: sessionsCount })}
        </span>
      )
    }
    return (
      <span className="font-medium text-indigo-700 dark:text-indigo-300">
        {t("memberships.sessions_remaining", "Còn {{rem}}/{{total}} buổi", { rem, total: sessionsCount })}
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
          {t("memberships.expired", "Đã hết hạn")}
        </span>
      )
    }
    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
          {t("memberships.days_remaining", "Còn {{count}} ngày", { count: days })}
        </span>
      )
    }
    return (
      <span className="font-medium text-emerald-700 dark:text-emerald-300">
        {t("memberships.days_remaining", "Còn {{count}} ngày", { count: days })}
      </span>
    )
  }

  return <span className="text-slate-400">-</span>
}

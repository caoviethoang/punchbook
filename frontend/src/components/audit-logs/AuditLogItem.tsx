import { Clock, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ACTION_LABELS, type AuditLogEntry } from "../../hooks/useAuditLogs"
import { formatDateTime } from "../../lib/formatters"
import type { TFunction } from "i18next"

function formatRelativeTime(isoString: string, t: TFunction): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t("audit_logs.just_now", "vừa xong")
  if (mins < 60) return t("audit_logs.minutes_ago", { count: mins, defaultValue: `${mins} phút trước` })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t("audit_logs.hours_ago", { count: hrs, defaultValue: `${hrs} giờ trước` })
  const days = Math.floor(hrs / 24)
  return t("audit_logs.days_ago", { count: days, defaultValue: `${days} ngày trước` })
}

interface AuditLogItemProps {
  log: AuditLogEntry
}

export function AuditLogItem({ log }: AuditLogItemProps) {
  const { t } = useTranslation()
  const actionInfo = ACTION_LABELS[log.action] || {
    label: log.action,
    icon: "•",
  }

  const renderDetails = () => {
    const d = log.details
    switch (log.action) {
      case "check_in": {
        const remainingText =
          d.sessions_after != null
            ? t("common.sessions_count", { count: d.sessions_after, defaultValue: `${d.sessions_after} buổi` })
            : t("common.unlimited", "Không giới hạn")
        return t("audit_logs.detail_check_in", {
          defaultValue: `Hội viên: ${d.membership_name} • Gói: ${d.package_name} • Còn lại: ${remainingText}`,
          member: d.membership_name,
          package: d.package_name,
          remaining: remainingText,
        })
      }
      case "membership_created":
        return t("audit_logs.detail_membership_created", {
          defaultValue: `Tên: ${d.customer_name} • SĐT: ${d.phone} • Gói: ${d.package_name}`,
          name: d.customer_name,
          phone: d.phone,
          package: d.package_name,
        })
      case "membership_renewed": {
        const beforeText =
          d.sessions_before != null
            ? t("common.sessions_count", { count: d.sessions_before, defaultValue: `${d.sessions_before} buổi` })
            : t("common.unlimited", "Không giới hạn")
        const afterText =
          d.sessions_after != null
            ? t("common.sessions_count", { count: d.sessions_after, defaultValue: `${d.sessions_after} buổi` })
            : t("common.unlimited", "Không giới hạn")
        return t("audit_logs.detail_membership_renewed", {
          defaultValue: `Hội viên: ${d.customer_name} • Trước: ${beforeText} → Sau: ${afterText}`,
          name: d.customer_name,
          before: beforeText,
          after: afterText,
        })
      }
      case "shop_plan_upgraded":
        return t("audit_logs.detail_shop_plan_upgraded", {
          defaultValue: `Gia hạn: ${d.months} tháng • Số tiền: ${Number(d.amount).toLocaleString("vi-VN")}đ`,
          months: d.months,
          amount: `${Number(d.amount).toLocaleString("vi-VN")}đ`,
        })
      case "membership_renewal_needed":
        return t("audit_logs.detail_membership_renewal_needed", {
          defaultValue: `Hội viên: ${d.customer_name} • Gói: ${d.package_name} • ${d.reason || t("audit_logs.action_membership_renewal_needed", "Cần gia hạn")}`,
          name: d.customer_name,
          package: d.package_name,
          reason: d.reason || t("audit_logs.action_membership_renewal_needed", "Cần gia hạn"),
        })
      default:
        return ""
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg dark:bg-slate-800">
        {actionInfo.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {t(`audit_logs.action_${log.action}`, actionInfo.label)}
          </span>
          {log.staff_name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <User className="h-3 w-3" />
              {log.staff_name}
            </span>
          )}
        </div>
        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
          {renderDetails()}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Clock className="h-3 w-3" />
          {formatDateTime(log.created_at)} ({formatRelativeTime(log.created_at, t)})
        </div>
      </div>
    </div>
  )
}

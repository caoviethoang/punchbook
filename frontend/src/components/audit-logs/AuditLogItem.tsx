import { Clock, User } from "lucide-react"
import { ACTION_LABELS, type AuditLogEntry } from "../../hooks/useAuditLogs"

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

interface AuditLogItemProps {
  log: AuditLogEntry
}

export function AuditLogItem({ log }: AuditLogItemProps) {
  const actionInfo = ACTION_LABELS[log.action] || {
    label: log.action,
    icon: "•",
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg dark:bg-slate-800">
        {actionInfo.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {actionInfo.label}
          </span>
          {log.staff_name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <User className="h-3 w-3" />
              {log.staff_name}
            </span>
          )}
        </div>
        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
          {log.action === "check_in" &&
            `Hội viên: ${log.details.membership_name} • Gói: ${log.details.package_name} • Còn lại: ${log.details.sessions_after} buổi`}
          {log.action === "membership_created" &&
            `Tên: ${log.details.customer_name} • SĐT: ${log.details.phone} • Gói: ${log.details.package_name}`}
          {log.action === "membership_renewed" &&
            `Hội viên: ${log.details.customer_name} • Trước: ${log.details.sessions_before} buổi → Sau: ${log.details.sessions_after} buổi`}
          {log.action === "shop_plan_upgraded" &&
            `Gia hạn: ${log.details.months} tháng • Số tiền: ${Number(log.details.amount).toLocaleString("vi-VN")}đ`}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Clock className="h-3 w-3" />
          {new Date(log.created_at).toLocaleString("vi-VN")} ({formatRelativeTime(log.created_at)})
        </div>
      </div>
    </div>
  )
}

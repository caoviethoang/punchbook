import { STATUS_CLASS, STATUS_LABEL, type MembershipStatus } from "../../lib/dashboard"

export interface StatusBadgeProps {
  status: MembershipStatus | string
  type?: "membership" | "invoice"
  className?: string
}

export function StatusBadge({ status, type = "membership", className = "" }: StatusBadgeProps) {
  if (type === "membership") {
    const memStatus = status as MembershipStatus
    const label = STATUS_LABEL[memStatus] || status
    const style = STATUS_CLASS[memStatus] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style} ${className}`}>
        {label}
      </span>
    )
  }

  // Invoice status badges
  switch (status) {
    case "paid":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ${className}`}>
          Đã thanh toán
        </span>
      )
    case "pending":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ${className}`}>
          Chờ thanh toán
        </span>
      )
    case "failed":
    case "cancelled":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300 ${className}`}>
          {status === "failed" ? "Thất bại" : "Đã hủy"}
        </span>
      )
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 ${className}`}>
          {status}
        </span>
      )
  }
}

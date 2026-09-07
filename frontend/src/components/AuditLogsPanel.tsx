import { useEffect, useState } from "react"
import { AlertCircle, Clock, Shield, User, X } from "lucide-react"
import { formatVnd } from "../lib/formatters"
import { getStoredToken } from "../lib/auth"

interface AuditLogEntry {
  id: string
  action: string
  staff_name: string | null
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
}

interface AuditLogsPanelProps {
  shopId: string
  onClose?: () => void
}

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  check_in: { label: "Check-in", icon: "✓" },
  membership_created: { label: "Thêm hội viên", icon: "+" },
  membership_renewed: { label: "Gia hạn hội viên", icon: "↺" },
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "vừa xong"
  if (mins < 60) return ` ${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

export function AuditLogsPanel({ shopId, onClose }: AuditLogsPanelProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("")

  useEffect(() => {
    const params = new URLSearchParams({ shop_id: shopId })
    if (filter) params.set("action", filter)

    const token = getStoredToken()
    fetch(`/audit_logs?${params}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load audit logs")
        return r.json()
      })
      .then((data) => {
        setLogs(data.audit_logs || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Lỗi tải nhật ký")
        setLoading(false)
      })
  }, [shopId, filter])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Nhật ký thao tác
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lịch sử hoạt động của nhân viên
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
          <div className="flex gap-2">
            {["", "check_in", "membership_created", "membership_renewed"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {f === ""
                    ? "Tất cả"
                    : ACTION_LABELS[f]?.label || f}
                </button>
              )
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "55vh" }}>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-slate-500">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có hoạt động nào.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const actionInfo =
                  ACTION_LABELS[log.action] || {
                    label: log.action,
                    icon: "•",
                  }
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg dark:bg-slate-800">
                      {actionInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                          {actionInfo.label}
                        </span>
                        {log.staff_name && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            <User className="h-3 w-3" />
                            {log.staff_name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-all">
                        {log.action === "check_in" &&
                          `Hội viên: ${log.details.membership_name} • Gói: ${log.details.package_name} • Còn lại: ${log.details.sessions_after} buổi`}
                        {log.action === "membership_created" &&
                          `Tên: ${log.details.customer_name} • SĐT: ${log.details.phone} • Gói: ${log.details.package_name}`}
                        {log.action === "membership_renewed" &&
                          `Hội viên: ${log.details.customer_name} • Trước: ${log.details.sessions_before} buổi → Sau: ${log.details.sessions_after} buổi`}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { AlertCircle, Shield, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuditLogs, ACTION_LABELS } from "../hooks/useAuditLogs"
import { AuditLogItem } from "./audit-logs/AuditLogItem"

interface AuditLogsPanelProps {
  shopId: string
  onClose?: () => void
}

const FILTER_OPTIONS = [
  "",
  "check_in",
  "membership_created",
  "membership_renewed",
  "shop_plan_upgraded",
]

export function AuditLogsPanel({ shopId, onClose }: AuditLogsPanelProps) {
  const { t } = useTranslation()
  const { logs, loading, error, filter, handleFilterChange } = useAuditLogs(shopId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {t("audit_logs.title", "Nhật ký thao tác")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("audit_logs.subtitle", "Lịch sử hoạt động của nhân viên")}
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
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {f === ""
                  ? t("common.all", "Tất cả")
                  : t(`audit_logs.action_${f}`, ACTION_LABELS[f]?.label || f)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "55vh" }}>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-slate-500">{t("common.loading", "Đang tải...")}</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("audit_logs.empty", "Chưa có hoạt động nào.")}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

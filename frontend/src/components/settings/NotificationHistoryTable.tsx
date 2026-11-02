import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react"
import {
  fetchNotificationLogs,
  type NotificationLog,
  type NotificationLogsPaginationMeta,
} from "../../lib/notifications"

interface NotificationHistoryTableProps {
  refreshTrigger?: number
}

export function NotificationHistoryTable({ refreshTrigger }: NotificationHistoryTableProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [meta, setMeta] = useState<NotificationLogsPaginationMeta>({
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)

  const loadLogs = useCallback(
    async (pageToLoad: number = currentPage) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchNotificationLogs({
          channel: selectedChannel !== "all" ? selectedChannel : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          page: pageToLoad,
          per_page: 10,
        })
        setLogs(res.notification_logs)
        setMeta(res.meta)
      } catch (err) {
        setError(err instanceof Error ? err.message : t("settings.notifications.load_logs_failed", "Không thể tải lịch sử thông báo"))
      } finally {
        setLoading(false)
      }
    },
    [selectedChannel, selectedStatus, currentPage, t]
  )

  useEffect(() => {
    let active = true

    fetchNotificationLogs({
      channel: selectedChannel !== "all" ? selectedChannel : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      page: currentPage,
      per_page: 10,
    })
      .then((res) => {
        if (!active) return
        setLogs(res.notification_logs)
        setMeta(res.meta)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : t("settings.notifications.load_logs_failed", "Không thể tải lịch sử thông báo"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedChannel, selectedStatus, currentPage, refreshTrigger, t])

  function formatTime(isoString?: string | null) {
    if (!isoString) return "-"
    try {
      const date = new Date(isoString)
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return isoString
    }
  }

  function renderChannelBadge(channel: string) {
    switch (channel) {
      case "email":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Mail className="h-3 w-3" />
            Email
          </span>
        )
      case "sms":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            <MessageSquare className="h-3 w-3" />
            SMS
          </span>
        )
      case "zalo":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <Smartphone className="h-3 w-3" />
            Zalo ZNS
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {channel}
          </span>
        )
    }
  }

  function renderStatusBadge(status: string) {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            {t("settings.notifications.status_sent", "Đã gửi")}
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <XCircle className="h-3 w-3" />
            {t("settings.notifications.status_failed", "Lỗi")}
          </span>
        )
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <MinusCircle className="h-3 w-3" />
            {t("settings.notifications.status_skipped", "Bỏ qua")}
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        )
    }
  }

  function formatEventType(event: string) {
    switch (event) {
      case "welcome":
        return t("settings.notifications.event_welcome", "Chào mừng hội viên")
      case "check_in_receipt":
        return t("settings.notifications.event_check_in_receipt", "Biên lai check-in")
      case "payment_receipt":
        return t("settings.notifications.event_payment_receipt", "Xác nhận thanh toán")
      case "expiring_reminder":
        return t("settings.notifications.event_expiring_reminder", "Nhắc hạn hội viên")
      case "test":
        return t("settings.notifications.event_test", "Thông báo thử nghiệm")
      default:
        return event
    }
  }

  return (
    <div className="space-y-4">
      {/* Header and Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("settings.notifications.history_title", "Lịch sử Gửi thông báo (Delivery Logs)")}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.notifications.history_subtitle", "Nhật ký các lượt thông báo đa kênh đã gửi, bao gồm trạng thái phân phối và mã lỗi nếu có.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Channel filter */}
          <select
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">{t("settings.notifications.filter_channel_all", "Tất cả kênh")}</option>
            <option value="email">{t("settings.notifications.filter_channel_email", "Email")}</option>
            <option value="sms">{t("settings.notifications.filter_channel_sms", "SMS")}</option>
            <option value="zalo">{t("settings.notifications.filter_channel_zalo", "Zalo ZNS")}</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">{t("settings.notifications.filter_status_all", "Tất cả trạng thái")}</option>
            <option value="sent">{t("settings.notifications.filter_status_sent", "Thành công")}</option>
            <option value="failed">{t("settings.notifications.filter_status_failed", "Thất bại")}</option>
            <option value="skipped">{t("settings.notifications.filter_status_skipped", "Bỏ qua")}</option>
          </select>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadLogs(currentPage)}
            disabled={loading}
            title={t("common.refresh", "Làm mới")}
            className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_time", "Thời gian")}</th>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_channel", "Kênh")}</th>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_event", "Sự kiện")}</th>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_recipient", "Người nhận")}</th>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_status", "Trạng thái")}</th>
              <th className="px-3.5 py-2.5 font-semibold">{t("settings.notifications.col_details", "Chi tiết / Lỗi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("settings.notifications.loading_logs", "Đang tải lịch sử thông báo...")}</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {t("settings.notifications.empty_logs", "Chưa có lượt gửi thông báo nào.")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                    {formatTime(log.sent_at || log.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5">{renderChannelBadge(log.channel)}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {formatEventType(log.event_type)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {log.recipient}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5">{renderStatusBadge(log.status)}</td>
                  <td className="max-w-[200px] truncate px-3.5 py-2.5 text-slate-500 dark:text-slate-400" title={log.error_message || ""}>
                    {log.error_message || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            {t("settings.webhook.pagination", "Trang {{page}} / {{totalPages}} (Tổng số: {{totalCount}})", {
              page: meta.page,
              totalPages: meta.total_pages,
              totalCount: meta.total,
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={meta.page <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.total_pages || loading}
              onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

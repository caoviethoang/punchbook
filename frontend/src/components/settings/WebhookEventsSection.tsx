import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  fetchWebhookEvents,
  retryWebhookEvent,
  type WebhookEvent,
  type WebhookEventStatus,
} from "../../lib/webhookEvents"
import { formatDateTime } from "../../lib/formatters"

interface WebhookEventsSectionProps {
  isAdmin: boolean
  onToast: (message: string, type: "success" | "error") => void
}

type FilterOption = "all" | "attention" | "dead_letter" | "success"

export function WebhookEventsSection({ isAdmin, onToast }: WebhookEventsSectionProps) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterOption>("all")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const perPage = 10

  const resolveStatusParam = useCallback(() => {
    if (filter === "dead_letter") return "dead_letter"
    if (filter === "success") return "success"
    return undefined
  }, [filter])

  useEffect(() => {
    if (!isAdmin) return

    let active = true
    const statusParam = resolveStatusParam()

    fetchWebhookEvents(statusParam, page, perPage)
      .then((data) => {
        if (!active) return
        let list = data.webhook_events
        if (filter === "attention") {
          list = list.filter((e) => e.status === "failed" || e.status === "dead_letter")
        }
        setEvents(list)
        setTotalCount(data.meta.total)
      })
      .catch((err) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : t("settings.webhook.load_failed", "Không thể tải danh sách webhook")
        onToast(msg, "error")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isAdmin, filter, page, resolveStatusParam, onToast, t])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const statusParam = resolveStatusParam()
      const data = await fetchWebhookEvents(statusParam, page, perPage)
      let list = data.webhook_events
      if (filter === "attention") {
        list = list.filter((e) => e.status === "failed" || e.status === "dead_letter")
      }
      setEvents(list)
      setTotalCount(data.meta.total)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("settings.webhook.load_failed", "Không thể tải danh sách webhook")
      onToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (event: WebhookEvent) => {
    setRetryingId(event.id)
    try {
      const res = await retryWebhookEvent(event.id)
      onToast(
        t("settings.webhook.retry_queued", {
          defaultValue: "Đã đưa đơn #{{order}} vào hàng đợi thử lại.",
          order: event.order_code ?? event.id.slice(0, 8),
        }),
        "success",
      )
      setEvents((prev) =>
        prev.map((item) => (item.id === event.id ? res.webhook_event : item))
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("settings.webhook.retry_failed", "Không thể thử lại webhook")
      onToast(msg, "error")
    } finally {
      setRetryingId(null)
    }
  }

  const renderStatusBadge = (status: WebhookEventStatus) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("settings.webhook.status_success", "Thành công")}
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("settings.webhook.status_failed", "Thất bại")}
          </span>
        )
      case "dead_letter":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("settings.webhook.status_dead_letter", "Dead Letter (DLQ)")}
          </span>
        )
      case "invalid_signature":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("settings.webhook.status_invalid_signature", "Sai chữ ký")}
          </span>
        )
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("settings.webhook.status_processing", "Đang xử lý")}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" />
            {t("settings.webhook.status_pending", "Chờ xử lý")}
          </span>
        )
    }
  }

  if (!isAdmin) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("settings.webhook.title", "Lịch sử Webhook PayOS & Dead-Letter Queue")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              "settings.webhook.subtitle",
              "Tự động lưu webhook, hàng đợi thử lại (Sidekiq retry 5 lần) và xử lý lỗi dead-letter.",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh", "Làm mới")}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setFilter("all")
            setPage(1)
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {t("settings.webhook.filter_all", "Tất cả")}
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("attention")
            setPage(1)
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "attention"
              ? "bg-rose-600 text-white dark:bg-rose-500"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {t("settings.webhook.filter_attention", "Cần xử lý (Lỗi / DLQ)")}
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("dead_letter")
            setPage(1)
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "dead_letter"
              ? "bg-purple-600 text-white dark:bg-purple-500"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {t("settings.webhook.filter_dead_letter", "Dead-Letter Queue")}
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("success")
            setPage(1)
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "success"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {t("settings.webhook.filter_success", "Thành công")}
        </button>
      </div>

      {/* Events Table / List */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("settings.webhook.col_time", "Thời gian")}</th>
                <th className="px-4 py-3 font-semibold">{t("settings.webhook.col_order_code", "Mã đơn PayOS")}</th>
                <th className="px-4 py-3 font-semibold">{t("settings.webhook.col_status", "Trạng thái")}</th>
                <th className="px-4 py-3 font-semibold">{t("settings.webhook.col_attempts", "Số lần thử")}</th>
                <th className="px-4 py-3 font-semibold">{t("settings.webhook.col_last_error", "Lỗi gần nhất")}</th>
                <th className="px-4 py-3 font-semibold text-right">{t("settings.webhook.col_actions", "Thao tác")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                    <span className="mt-2 block text-xs">{t("settings.webhook.loading", "Đang tải webhook...")}</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {t("settings.webhook.empty", "Không có webhook nào phù hợp bộ lọc.")}
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {event.order_code ? `#${event.order_code}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {renderStatusBadge(event.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                      {event.attempts} / {event.max_attempts}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500 dark:text-slate-400" title={event.last_error ?? ""}>
                      {event.last_error ? (
                        <span className="text-rose-600 dark:text-rose-400">{event.last_error}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {event.retryable ? (
                        <button
                          type="button"
                          onClick={() => void handleRetry(event)}
                          disabled={retryingId === event.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                        >
                          <RotateCcw
                            className={`h-3 w-3 ${retryingId === event.id ? "animate-spin" : ""}`}
                          />
                          {retryingId === event.id
                            ? t("common.processing", "Đang xử lý...")
                            : t("common.retry", "Thử lại")}
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.webhook.pagination", {
                defaultValue: "Trang {{page}} / {{totalPages}} (Tổng số: {{totalCount}})",
                page,
                totalPages,
                totalCount,
              })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label={t("common.prev", "Trang trước")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label={t("common.next", "Trang sau")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

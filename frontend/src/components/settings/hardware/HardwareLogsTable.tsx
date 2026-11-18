import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { RefreshCw, CheckCircle2, History, AlertCircle } from "lucide-react"
import { fetchHardwareAccessLogs, type HardwareAccessLog } from "../../../lib/hardware"

interface HardwareLogsTableProps {
  onToast?: (message: string, type: "success" | "error") => void
}

export function HardwareLogsTable({ onToast }: HardwareLogsTableProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<HardwareAccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHardwareAccessLogs()
      setLogs(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("settings.device.logs_fetch_failed", "Không thể tải lịch sử mở cửa")
      setError(msg)
      if (onToast) onToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }, [onToast, t])

  useEffect(() => {
    let isCancelled = false
    fetchHardwareAccessLogs()
      .then((data) => {
        if (!isCancelled) setLogs(data)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : t("settings.device.logs_fetch_failed", "Không thể tải lịch sử mở cửa")
          setError(msg)
          if (onToast) onToast(msg, "error")
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [onToast, t])

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString)
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t("settings.device.access_logs_title", "Nhật ký mở cửa theo thời gian thực (Live Access Stream)")}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          title={t("common.refresh", "Làm mới")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{t("common.refresh", "Làm mới")}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-sky-500" />
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="ml-auto underline hover:no-underline"
          >
            {t("common.retry", "Thử lại")}
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.device.no_logs", "Chưa có lượt quẹt thẻ / mở cửa nào qua thiết bị ngoại vi.")}
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5">{t("settings.device.logs_time", "Thời gian")}</th>
                <th className="px-4 py-2.5">{t("settings.device.logs_member", "Hội viên")}</th>
                <th className="px-4 py-2.5">{t("settings.device.logs_package", "Gói tập")}</th>
                <th className="px-4 py-2.5">{t("settings.device.logs_device", "Thiết bị")}</th>
                <th className="px-4 py-2.5">{t("settings.device.logs_status", "Trạng thái")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {formatTime(log.checked_in_at)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                    {log.member_name || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {log.package_name || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {log.device_name || "Thiết bị"}
                    </span>
                    {log.location && (
                      <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">
                        ({log.location})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("settings.device.access_granted_badge", "Mở cửa thành công")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

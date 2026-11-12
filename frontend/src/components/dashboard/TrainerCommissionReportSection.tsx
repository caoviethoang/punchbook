import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  FileSpreadsheet,
  Loader2,
  Users,
  Wallet,
} from "lucide-react"
import type { Staff } from "../../lib/auth"
import { toApiError } from "../../lib/errors"
import { formatDateTime, formatVnd } from "../../lib/formatters"
import {
  downloadTrainerCommissionsExcelReport,
  getTrainerCommissionsReport,
  type TrainerCommissionReportResponse,
} from "../../lib/trainerCommissions"
import { fetchTrainers, type TrainerOption } from "../../lib/staffs"

interface TrainerCommissionReportSectionProps {
  currentStaff?: Staff | null
  onSelectDetail?: (membershipId: string) => void
}

function currentMonthString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function TrainerCommissionReportSection({
  currentStaff,
  onSelectDetail,
}: TrainerCommissionReportSectionProps) {
  const { t } = useTranslation()
  const isAdmin = !currentStaff || currentStaff.role === "admin"
  const isTrainer = currentStaff?.role === "trainer"

  const [month, setMonth] = useState<string>(currentMonthString)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("")
  const [trainersList, setTrainersList] = useState<TrainerOption[]>([])
  const [data, setData] = useState<TrainerCommissionReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"summary" | "sessions">("summary")

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    fetchTrainers()
      .then((list) => {
        if (active) setTrainersList(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isAdmin])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTrainerCommissionsReport(
        month,
        isAdmin ? selectedTrainerId || undefined : undefined,
      )
      setData(res)
    } catch (err) {
      setError(toApiError(err, "Không thể tải báo cáo hoa hồng PT."))
    } finally {
      setLoading(false)
    }
  }, [month, selectedTrainerId, isAdmin])

  useEffect(() => {
    let active = true
    getTrainerCommissionsReport(
      month,
      isAdmin ? selectedTrainerId || undefined : undefined,
    )
      .then((res) => {
        if (active) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) setError(toApiError(err, "Không thể tải báo cáo hoa hồng PT."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [month, selectedTrainerId, isAdmin])

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      await downloadTrainerCommissionsExcelReport(month, selectedTrainerId || undefined)
    } catch (err) {
      setExportError(toApiError(err, "Xuất báo cáo hoa hồng PT thất bại."))
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {isTrainer
                ? t("trainer_commissions.trainer_title", "Thu nhập & Ca dạy PT của tôi")
                : t("trainer_commissions.admin_title", "Báo cáo Hoa hồng PT & Huấn luyện viên")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isTrainer
                ? t(
                    "trainer_commissions.trainer_subtitle",
                    "Theo dõi số buổi tập đã hướng dẫn, doanh số và hoa hồng trong tháng",
                  )
                : t(
                    "trainer_commissions.admin_subtitle",
                    "Tổng hợp buổi dạy hoàn thành, doanh số chốt gói PT và bảng tính hoa hồng hàng tháng",
                  )}
            </p>
          </div>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && trainersList.length > 0 && (
            <select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              aria-label={t("trainer_commissions.filter_trainer", "Lọc theo huấn luyện viên")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">
                {t("trainer_commissions.all_trainers", "Tất cả huấn luyện viên")}
              </option>
              {trainersList.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name} ({tr.role === "trainer" ? "PT" : "Admin"})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label={t("attendance.prev_month", "Tháng trước")}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={month}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
                className="cursor-pointer bg-transparent text-sm font-semibold text-slate-800 outline-none dark:text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label={t("attendance.next_month", "Tháng sau")}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span>{t("trainer_commissions.export_excel", "Xuất Excel")}</span>
            </button>
          )}
        </div>
      </div>

      {exportError && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadReport()}
            className="rounded-lg bg-rose-100 px-2.5 py-1 font-semibold hover:bg-rose-200 dark:bg-rose-900/50"
          >
            {t("common.retry", "Thử lại")}
          </button>
        </div>
      )}

      {/* Summary KPI Grid */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t("trainer_commissions.kpi_sessions", "Buổi dạy hoàn thành")}</span>
              <Clock className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-50">
              {summary.total_sessions_completed}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t("trainer_commissions.kpi_session_comm", "Hoa hồng buổi dạy")}</span>
              <Dumbbell className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatVnd(summary.total_session_commission)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t("trainer_commissions.kpi_sales", "Doanh số gói PT")}</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-50">
              {formatVnd(summary.total_sales_amount)}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>{t("trainer_commissions.kpi_total_comm", "Tổng hoa hồng PT")}</span>
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatVnd(summary.total_commission)}
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tabs: Summary vs Sessions Log */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "summary"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          {t("trainer_commissions.tab_summary", "Bảng tổng hợp PT")} ({data?.trainers.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "sessions"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          {t("trainer_commissions.tab_sessions", "Chi tiết buổi dạy")} ({data?.sessions.length ?? 0})
        </button>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : activeTab === "summary" ? (
        <div className="overflow-x-auto">
          {!data || data.trainers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {t("trainer_commissions.empty_trainers", "Chưa có dữ liệu huấn luyện viên trong tháng này.")}
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 pr-4 font-semibold">
                    {t("trainer_commissions.col_trainer", "Huấn luyện viên")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t("trainer_commissions.col_clients", "Học viên")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t("trainer_commissions.col_sessions", "Buổi dạy")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    {t("trainer_commissions.col_session_comm", "HH Buổi dạy")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    {t("trainer_commissions.col_sales", "Doanh số")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    {t("trainer_commissions.col_sale_comm", "HH Doanh số")}
                  </th>
                  <th className="py-2.5 pl-3 font-semibold text-right">
                    {t("trainer_commissions.col_total", "Tổng hoa hồng")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.trainers.map((row) => (
                  <tr key={row.trainer_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.trainer_name}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {row.trainer_role === "trainer" ? "PT" : "Admin"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.assigned_clients_count}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {row.sessions_completed}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatVnd(row.session_commission)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      <div>{formatVnd(row.sales_amount)}</div>
                      <span className="text-[10px] text-slate-400">
                        ({row.sales_count} {t("trainer_commissions.packages_unit", "gói")})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatVnd(row.sale_commission)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatVnd(row.total_commission)}
                      </div>
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                          row.payout_status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {row.payout_status === "pending"
                          ? t("trainer_commissions.status_pending", "Chờ chi trả")
                          : t("trainer_commissions.status_settled", "Không phát sinh")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {!data || data.sessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {t("trainer_commissions.empty_sessions", "Chưa có buổi dạy PT nào được ghi nhận trong tháng này.")}
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 pr-3 font-semibold">
                    {t("trainer_commissions.col_time", "Thời gian")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("trainer_commissions.col_trainer", "Huấn luyện viên")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("trainer_commissions.col_client", "Học viên")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("trainer_commissions.col_package", "Gói dịch vụ")}
                  </th>
                  <th className="py-2.5 pl-3 font-semibold text-right">
                    {t("trainer_commissions.col_commission", "Hoa hồng")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.sessions.map((s) => (
                  <tr key={s.check_in_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 tabular-nums">
                      {s.checked_in_at ? formatDateTime(s.checked_in_at) : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {s.trainer_name || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectDetail?.(s.membership_id)}
                        className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {s.customer_name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {s.package_name}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatVnd(s.commission_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

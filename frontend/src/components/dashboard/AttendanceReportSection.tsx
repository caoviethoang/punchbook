import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Flame,
  Loader2,
  Search,
  Users,
} from "lucide-react"
import { useAttendanceReport } from "../../hooks/useAttendanceReport"
import type { AttendanceRecord } from "../../lib/attendance"

interface AttendanceReportSectionProps {
  onSelectDetail?: (membershipId: string) => void
  onUpgradeRequired?: () => void
}

export function AttendanceReportSection({
  onSelectDetail,
  onUpgradeRequired,
}: AttendanceReportSectionProps) {
  const {
    month,
    setMonth,
    data,
    loading,
    error,
    exporting,
    exportError,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    filteredRecords,
    loadReport,
    prevMonth,
    nextMonth,
    handleExport,
  } = useAttendanceReport()

  const [localExportError, setLocalExportError] = useState<string | null>(null)

  const onExportClick = async () => {
    setLocalExportError(null)
    try {
      await handleExport()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Xuất báo cáo thất bại."
      setLocalExportError(errorMsg)
      if (
        errorMsg.includes("Gói Free không hỗ trợ") ||
        errorMsg.includes("PLAN_UPGRADE_REQUIRED")
      ) {
        onUpgradeRequired?.()
      }
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Báo cáo chuyên cần hội viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theo dõi mức độ tích cực và phát hiện hội viên có nguy cơ bỏ tập theo tháng
            </p>
          </div>
        </div>

        {/* Month Navigation & Export CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={prevMonth}
              title="Tháng trước"
              aria-label="Tháng trước"
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
              onClick={nextMonth}
              title="Tháng sau"
              aria-label="Tháng sau"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void onExportClick()}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Export Error Alert */}
      {(exportError || localExportError) && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{localExportError || exportError}</span>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-slate-400" />
              <span>Tổng hội viên</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
              {summary.total_members}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-950/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã đi tập</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                {summary.active_members_count}
              </p>
              {summary.total_members > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round((summary.active_members_count / summary.total_members) * 100)}%
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Chưa đi tập</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">
                {summary.inactive_members_count}
              </p>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                nguy cơ bỏ tập
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-400">
              <Flame className="h-4 w-4" />
              <span>Tổng lượt check-in</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">
                {summary.total_check_ins}
              </p>
              {summary.active_members_count > 0 && (
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  ~{summary.avg_check_ins_per_active_member}/người
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <FilterTabButton
            active={filterTab === "all"}
            label="Tất cả"
            count={summary?.total_members}
            onClick={() => setFilterTab("all")}
          />
          <FilterTabButton
            active={filterTab === "active"}
            label="Chuyên cần"
            count={summary?.active_members_count}
            onClick={() => setFilterTab("active")}
          />
          <FilterTabButton
            active={filterTab === "inactive"}
            label="Chưa tập buổi nào"
            count={summary?.inactive_members_count}
            variant="danger"
            onClick={() => setFilterTab("inactive")}
          />
        </div>

        <div className="relative min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, gói..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Content: Loading, Error or Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadReport()}
            className="mt-2 text-xs font-semibold underline hover:text-red-800"
          >
            Thử lại
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {searchQuery
            ? "Không tìm thấy hội viên phù hợp với từ khóa."
            : "Chưa có dữ liệu hội viên cho tháng này."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pl-2 pr-3">Xếp hạng</th>
                <th className="px-3 py-2.5">Hội viên</th>
                <th className="px-3 py-2.5">Gói dịch vụ</th>
                <th className="px-3 py-2.5 text-center">Số buổi tháng này</th>
                <th className="px-3 py-2.5">Buổi gần nhất</th>
                <th className="px-3 py-2.5">Đánh giá</th>
                {onSelectDetail && <th className="py-2.5 pl-3 pr-2 text-right">Chi tiết</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map((record) => (
                <AttendanceRow
                  key={record.membership_id}
                  record={record}
                  onSelectDetail={onSelectDetail}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface FilterTabButtonProps {
  active: boolean
  label: string
  count?: number
  variant?: "normal" | "danger"
  onClick: () => void
}

function FilterTabButton({
  active,
  label,
  count,
  variant = "normal",
  onClick,
}: FilterTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? variant === "danger"
            ? "bg-rose-600 text-white shadow-sm"
            : "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            active
              ? variant === "danger"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

interface AttendanceRowProps {
  record: AttendanceRecord
  onSelectDetail?: (id: string) => void
}

function AttendanceRow({ record, onSelectDetail }: AttendanceRowProps) {
  return (
    <tr
      className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
        record.is_inactive ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
      }`}
    >
      {/* Rank column */}
      <td className="py-3 pl-2 pr-3">
        <RankBadge rank={record.rank} isInactive={record.is_inactive} />
      </td>

      {/* Member column */}
      <td className="px-3 py-3">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {record.customer_name}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{record.phone}</div>
      </td>

      {/* Package column */}
      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
        <span className="font-medium">{record.package_name}</span>
      </td>

      {/* Check-ins count */}
      <td className="px-3 py-3 text-center">
        <span
          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold ${
            record.check_ins_count === 0
              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              : record.check_ins_count >= 12
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                : record.check_ins_count >= 4
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
          }`}
        >
          {record.check_ins_count} buổi
        </span>
      </td>

      {/* Last check-in */}
      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
        {record.last_check_in_at ? (
          new Date(record.last_check_in_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        ) : (
          <span className="italic text-slate-400 dark:text-slate-500">Chưa có</span>
        )}
      </td>

      {/* Evaluation / Risk */}
      <td className="px-3 py-3">
        {record.is_inactive ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="h-3 w-3" />
            Chưa đi tập (Nguy cơ)
          </span>
        ) : record.check_ins_count >= 12 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
            <Flame className="h-3 w-3" />
            Rất tích cực (≥3 buổi/tuần)
          </span>
        ) : record.check_ins_count >= 4 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Đều đặn (≥1 buổi/tuần)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            Ít đi tập (&lt;1 buổi/tuần)
          </span>
        )}
      </td>

      {/* Action */}
      {onSelectDetail && (
        <td className="py-3 pl-3 pr-2 text-right">
          <button
            type="button"
            onClick={() => onSelectDetail(record.membership_id)}
            title="Xem chi tiết hội viên"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span>Xem</span>
          </button>
        </td>
      )}
    </tr>
  )
}

interface RankBadgeProps {
  rank: number | null
  isInactive: boolean
}

function RankBadge({ rank, isInactive }: RankBadgeProps) {
  if (isInactive || rank === null) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        -
      </span>
    )
  }

  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 shadow-sm dark:bg-amber-950/60 dark:text-amber-300">
        🥇 #1
      </span>
    )
  }

  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200">
        🥈 #2
      </span>
    )
  }

  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800 shadow-sm dark:bg-orange-950/60 dark:text-orange-300">
        🥉 #3
      </span>
    )
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      #{rank}
    </span>
  )
}

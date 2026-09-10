import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  AlertCircle,
  CalendarClock,
  Eye,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  Users,
  Wallet,
} from "lucide-react"
import { useDashboard } from "../hooks/useDashboard"
import type { DashboardMembership } from "../lib/dashboard"
import { toApiError } from "../lib/errors"
import { formatVnd, remainingLabel } from "../lib/formatters"
import {
  fetchMemberships,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { downloadExcelReport } from "../lib/reports"
import { ImportMembersModal } from "./ImportMembersModal"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { RenewalModal } from "./RenewalModal"
import { StatusBadge } from "./ui/StatusBadge"

function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  )
}

const STATUS_TABS: { key: StatusFilterType; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Còn hạn" },
  { key: "expiring", label: "Sắp hết" },
  { key: "expired", label: "Đã hết" },
]

export function DashboardScreen() {
  const { data, loading, error, load } = useDashboard()
  const [selectedMembershipForRenewal, setSelectedMembershipForRenewal] =
    useState<DashboardMembership | null>(null)
  const [selectedMembershipIdForDetail, setSelectedMembershipIdForDetail] =
    useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Pagination & Filtering state
  const [memberships, setMemberships] = useState<DashboardMembership[]>([])
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all")
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    void load().catch(() => {
      // Ignored
    })
  }, [load])

  useEffect(() => {
    let active = true
    fetchMemberships({
      query: searchQuery,
      status: statusFilter,
      page,
      per_page: 20,
    })
      .then((res) => {
        if (!active) return
        setMemberships(res.memberships as DashboardMembership[])
        if (res.meta) {
          setPaginationMeta(res.meta)
        }
      })
      .catch(() => {
        // Ignored
      })
      .finally(() => {
        if (active) {
          setListLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [searchQuery, statusFilter, page])

  const refreshList = useCallback(() => {
    setListLoading(true)
    fetchMemberships({
      query: searchQuery,
      status: statusFilter,
      page,
      per_page: 20,
    })
      .then((res) => {
        setMemberships(res.memberships as DashboardMembership[])
        if (res.meta) setPaginationMeta(res.meta)
      })
      .finally(() => setListLoading(false))
  }, [searchQuery, statusFilter, page])

  const handleExport = async () => {
    try {
      setExporting(true)
      setExportError(null)
      await downloadExcelReport()
    } catch (err) {
      setExportError(toApiError(err, "Xuất báo cáo thất bại."))
    } finally {
      setExporting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-4 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:mx-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {exportError && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{exportError}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Dashboard
          </h2>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Tình hình shop trong tháng này
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Doanh thu tháng"
          value={formatVnd(data.revenue_this_month)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <Metric
          label="Hội viên active"
          value={String(data.active_memberships_count)}
          icon={<Users className="h-4 w-4" />}
        />
        <Metric
          label="Sắp hết hạn (7 ngày)"
          value={String(data.expiring_within_7_days_count)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Danh sách Hội viên
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc sđt..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/60">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === tab.key
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Không tìm thấy hội viên nào.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên</th>
                  <th className="px-4 py-3 font-semibold">Gói</th>
                  <th className="px-4 py-3 font-semibold">Còn lại</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMembershipIdForDetail(membership.id)}
                        className="text-left group/btn focus:outline-none"
                      >
                        <p className="font-semibold text-slate-900 group-hover/btn:text-indigo-600 dark:text-slate-50 dark:group-hover/btn:text-indigo-400">
                          {membership.customer_name}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {membership.phone}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {membership.package?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {remainingLabel(membership)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={membership.status} type="membership" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMembershipIdForDetail(membership.id)}
                          title="Xem chi tiết & lịch sử"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMembershipForRenewal(membership)}
                          title="Gia hạn gói"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Gia hạn</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginationMeta && paginationMeta.total_pages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Trang {paginationMeta.page} / {paginationMeta.total_pages} (Tổng {paginationMeta.total} hội viên)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || listLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={page >= paginationMeta.total_pages || listLoading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedMembershipIdForDetail && (
        <MembershipDetailModal
          membershipId={selectedMembershipIdForDetail}
          onClose={() => setSelectedMembershipIdForDetail(null)}
        />
      )}

      {selectedMembershipForRenewal && (
        <RenewalModal
          membership={selectedMembershipForRenewal}
          onClose={() => {
            setSelectedMembershipForRenewal(null)
            refreshList()
          }}
        />
      )}

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          void load()
          refreshList()
        }}
      />
    </div>
  )
}

import { Eye, Loader2, RefreshCw, Search } from "lucide-react"
import type { DashboardMembership } from "../../lib/dashboard"
import { remainingLabel } from "../../lib/formatters"
import {
  computeMembershipStatus,
  type PaginationMeta,
  type StatusFilterType,
} from "../../lib/memberships"
import { StatusBadge } from "../ui/StatusBadge"

const STATUS_TABS: { key: StatusFilterType; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Còn hạn" },
  { key: "expiring", label: "Sắp hết" },
  { key: "expired", label: "Đã hết" },
]

interface DashboardMembershipsTableProps {
  memberships: DashboardMembership[]
  paginationMeta: PaginationMeta | null
  searchQuery: string
  onSearchChange: (q: string) => void
  statusFilter: StatusFilterType
  onStatusFilterChange: (s: StatusFilterType) => void
  page: number
  onPageChange: (p: number) => void
  listLoading: boolean
  onSelectDetail: (id: string) => void
  onSelectRenewal: (m: DashboardMembership) => void
}

export function DashboardMembershipsTable({
  memberships,
  paginationMeta,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  onPageChange,
  listLoading,
  onSelectDetail,
  onSelectRenewal,
}: DashboardMembershipsTableProps) {
  return (
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/60">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusFilterChange(tab.key)}
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
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
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
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800 transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectDetail(membership.id)}
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
                    <StatusBadge
                      status={membership.status ?? computeMembershipStatus(membership)}
                      type="membership"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(membership.id)}
                        title="Xem chi tiết & lịch sử"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectRenewal(membership)}
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
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= paginationMeta.total_pages || listLoading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

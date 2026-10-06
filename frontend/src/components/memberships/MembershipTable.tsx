import { Edit3, Eye, Loader2, QrCode, RefreshCw, Trash2 } from "lucide-react"
import type { Membership, PaginationMeta, StatusFilterType } from "../../lib/memberships"
import { computeMembershipStatus } from "../../lib/memberships"
import { StatusBadge } from "../ui/StatusBadge"
import { MemberRemainingBadge } from "./MemberRemainingBadge"

interface MembershipTableProps {
  loading: boolean
  error: string | null
  memberships: Membership[]
  meta: PaginationMeta | null
  page: number
  debouncedQuery: string
  status: StatusFilterType
  onReload: () => void
  onPageChange: (p: number) => void
  onOpenQR: (m: Membership) => void
  onOpenDetail: (id: string) => void
  onOpenEdit: (m: Membership) => void
  onOpenDelete: (m: Membership) => void
}

export function MembershipTable({
  loading,
  error,
  memberships,
  meta,
  page,
  debouncedQuery,
  status,
  onReload,
  onPageChange,
  onOpenQR,
  onOpenDetail,
  onOpenEdit,
  onOpenDelete,
}: MembershipTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (memberships.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {debouncedQuery || status !== "all"
          ? "Không tìm thấy hội viên khớp với bộ lọc."
          : "Chưa có hội viên nào trong cửa hàng."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Tên hội viên</th>
              <th className="px-4 py-3.5 font-semibold">Gói đăng ký</th>
              <th className="px-4 py-3.5 font-semibold">Thời hạn / Số buổi</th>
              <th className="px-4 py-3.5 font-semibold">Trạng thái</th>
              <th className="px-4 py-3.5 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {memberships.map((m) => (
              <tr key={m.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenQR(m)}
                      title="Xem mã QR Check-in"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(m.id)}
                        className="font-semibold text-slate-900 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                      >
                        {m.customer_name}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                  {m.package?.name || "Không rõ"}
                </td>
                <td className="px-4 py-3.5">
                  <MemberRemainingBadge membership={m} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={computeMembershipStatus(m)} type="membership" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(m.id)}
                      title="Chi tiết & Lịch sử"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="hidden sm:inline">Chi tiết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEdit(m)}
                      title="Gia hạn / Chỉnh sửa"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="hidden sm:inline">Gia hạn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEdit(m)}
                      title="Sửa thông tin"
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDelete(m)}
                      title="Xóa hội viên"
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Hiển thị trang {meta.page} / {meta.total_pages} (Tổng {meta.total} hội viên)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= meta.total_pages || loading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

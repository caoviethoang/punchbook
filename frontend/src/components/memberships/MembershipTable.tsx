import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  QrCode,
  Trash2,
  Users,
} from "lucide-react"
import type { Membership, PaginationMeta } from "../../lib/memberships"
import { MemberRemainingBadge } from "./MemberRemainingBadge"

interface MembershipTableProps {
  loading: boolean
  error: string | null
  memberships: Membership[]
  meta: PaginationMeta | null
  page: number
  debouncedQuery: string
  status: string
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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-3 text-sm font-medium">Đang tải danh sách hội viên...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={onReload}
            className="mt-3 text-xs font-bold underline hover:text-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : memberships.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center text-slate-500">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h4 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
            Không tìm thấy hội viên nào
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            {debouncedQuery || status !== "all"
              ? "Thử tìm kiếm với từ khóa hoặc bộ lọc khác."
              : "Nhấn nút 'Thêm hội viên' để bắt đầu đăng ký hội viên mới."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 font-bold">Hội viên</th>
                <th className="px-5 py-4 font-bold">Gói dịch vụ</th>
                <th className="px-5 py-4 font-bold">Mã QR</th>
                <th className="px-5 py-4 font-bold">Buổi / Hạn dùng</th>
                <th className="px-5 py-4 font-bold">Check-in hôm nay</th>
                <th className="px-5 py-4 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {memberships.map((m) => (
                <tr
                  key={m.id}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  {/* Customer Name & Phone */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-50">
                      {m.customer_name}
                    </div>
                    <div className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {m.phone}
                    </div>
                  </td>

                  {/* Package */}
                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    {m.package.name}
                  </td>

                  {/* Member QR Code button */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onOpenQR(m)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                    >
                      <QrCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Mã QR</span>
                    </button>
                  </td>

                  {/* Sessions left / Expiry */}
                  <td className="px-5 py-4">
                    <MemberRemainingBadge membership={m} />
                  </td>

                  {/* Today Check-in Badge */}
                  <td className="px-5 py-4">
                    {m.checked_in_today ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã điểm danh
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(m.id)}
                        title="Xem chi tiết"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEdit(m)}
                        title="Chỉnh sửa"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDelete(m)}
                        title="Xóa hội viên"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/60"
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
      )}

      {/* Pagination Bar */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Trang {meta.page} / {meta.total_pages} (Tổng {meta.total} hội viên)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trước</span>
            </button>

            <button
              type="button"
              disabled={page >= meta.total_pages}
              onClick={() => onPageChange(Math.min(meta.total_pages, page + 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>Sau</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

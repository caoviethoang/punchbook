import { FileSpreadsheet, UserPlus } from "lucide-react"
import type { PaginationMeta } from "../../lib/memberships"

interface MembershipHeaderProps {
  meta: PaginationMeta | null
  isAdmin: boolean
  onOpenImportModal: () => void
  onOpenCreateModal: () => void
}

export function MembershipHeader({
  meta,
  isAdmin,
  onOpenImportModal,
  onOpenCreateModal,
}: MembershipHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Quản lý hội viên
          </h2>
          {meta && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              {meta.total} hội viên
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Danh sách, tạo mới, quét mã QR và quản lý thông tin hội viên
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Thêm hội viên</span>
        </button>
      </div>
    </div>
  )
}

import { Plus, Upload } from "lucide-react"
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Danh sách Hội viên
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tổng cộng {meta?.total ?? 0} hội viên trong hệ thống
        </p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm hội viên mới</span>
          </button>
        </div>
      )}
    </div>
  )
}

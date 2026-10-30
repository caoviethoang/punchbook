import { Package as PackageIcon, Plus, Settings2 } from "lucide-react"

interface PackageScreenHeaderProps {
  isAdmin: boolean
  onOpenCategoryManager: () => void
  onOpenCreate: () => void
}

export function PackageScreenHeader({
  isAdmin,
  onOpenCategoryManager,
  onOpenCreate,
}: PackageScreenHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <PackageIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Gói Dịch Vụ
        </h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          Quản lý các gói tập và lượt dịch vụ dành cho hội viên cửa hàng
        </p>
      </div>

      {isAdmin && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Quản lý danh mục</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo gói mới</span>
          </button>
        </div>
      )}
    </div>
  )
}

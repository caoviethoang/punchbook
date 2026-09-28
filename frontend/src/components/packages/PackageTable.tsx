import { Calendar, Clock, Edit2, Package as PackageIcon, Plus, Tag, Trash2 } from "lucide-react"
import {
  formatPackageDuration,
  formatPackageTypeBadge,
  type PackageItem,
} from "../../lib/packages"
import { formatVndInput } from "../../lib/formatters"

interface PackageGridProps {
  loading: boolean
  packages: PackageItem[]
  filteredPackages: PackageItem[]
  onOpenCreate: () => void
  onOpenEdit: (pkg: PackageItem) => void
  onDeleteRequest: (pkg: PackageItem) => void
}

export function PackageGrid({
  loading,
  packages,
  filteredPackages,
  onOpenCreate,
  onOpenEdit,
  onDeleteRequest,
}: PackageGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 h-5 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
            <div className="mt-6 h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>
    )
  }

  if (filteredPackages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <PackageIcon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {packages.length === 0
            ? "Chưa có gói dịch vụ nào"
            : "Không tìm thấy gói thuộc môn tập này"}
        </h3>
        <p className="mt-2 max-w-sm text-base text-slate-500 dark:text-slate-400">
          {packages.length === 0
            ? "Hãy tạo gói dịch vụ đầu tiên để áp dụng khi tạo thẻ hội viên mới."
            : "Thử chọn bộ môn khác hoặc tạo gói mới cho bộ môn này."}
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-indigo-500"
        >
          <Plus className="h-5 w-5" />
          Tạo gói ngay
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredPackages.map((pkg) => {
        const isSessionType = pkg.sessions_count !== null
        const badgeLabel = formatPackageTypeBadge(pkg)
        const durationLabel = formatPackageDuration(pkg)

        return (
          <div
            key={pkg.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/60"
          >
            <div>
              {pkg.category_name && (
                <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Tag className="h-3 w-3" />
                  <span>{pkg.category_name}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {pkg.name}
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isSessionType
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  {isSessionType ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  <span>{badgeLabel}</span>
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatVndInput(String(pkg.price))}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  VNĐ
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Thời hạn / Số lượng:{" "}
                <strong className="font-semibold text-slate-900 dark:text-slate-200">
                  {durationLabel}
                </strong>
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => onOpenEdit(pkg)}
                title="Chỉnh sửa gói"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Edit2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteRequest(pkg)}
                title="Xóa gói dịch vụ"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
              >
                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

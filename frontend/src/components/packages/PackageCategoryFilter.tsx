import { ArrowUpDown, Filter } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PackageCategory, PackageItem } from "../../lib/packages"
import type { PackageSortOption } from "../../hooks/usePackagesScreen"

interface PackageCategoryFilterProps {
  categories: PackageCategory[]
  packages: PackageItem[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  sortBy?: PackageSortOption
  onSortByChange?: (sort: PackageSortOption) => void
}

export function PackageCategoryFilter({
  categories,
  packages,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortByChange,
}: PackageCategoryFilterProps) {
  const { t } = useTranslation()
  const uncategorizedCount = packages.filter((p) => !p.package_category_id).length

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span>{t("packages.discipline", "Bộ môn:")}</span>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <span>{t("packages.all_disciplines", "Tất cả môn")}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              selectedCategory === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {packages.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = packages.filter((p) => p.package_category_id === cat.id).length
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}

        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectCategory("uncategorized")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              selectedCategory === "uncategorized"
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("packages.uncategorized", "Chưa phân loại")}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                selectedCategory === "uncategorized"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {uncategorizedCount}
            </span>
          </button>
        )}
      </div>

      {/* Sort Options */}
      {onSortByChange && sortBy && (
        <div className="flex shrink-0 items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("packages.sort_by", "Sắp xếp:")}
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as PackageSortOption)}
            aria-label="Sắp xếp danh sách gói"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <option value="category">{t("packages.sort_category", "Theo danh mục")}</option>
            <option value="name">{t("packages.sort_name", "Theo tên (A-Z)")}</option>
            <option value="price_asc">{t("packages.sort_price_asc", "Giá: Thấp đến cao")}</option>
            <option value="price_desc">{t("packages.sort_price_desc", "Giá: Cao đến thấp")}</option>
          </select>
        </div>
      )}
    </div>
  )
}

import { Filter } from "lucide-react"
import type { PackageCategory, PackageItem } from "../../lib/packages"

interface PackageCategoryFilterProps {
  categories: PackageCategory[]
  packages: PackageItem[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
}

export function PackageCategoryFilter({
  categories,
  packages,
  selectedCategory,
  onSelectCategory,
}: PackageCategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <div className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Filter className="h-3.5 w-3.5" />
        <span>Bộ môn:</span>
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
        <span>Tất cả môn</span>
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
        const count = packages.filter(
          (p) => p.package_category_id === cat.id,
        ).length
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
    </div>
  )
}

import { Search, Tag as TagIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { StatusFilterType } from "../../lib/memberships"
import type { MemberTag } from "../../lib/tags"

const FILTER_TABS: { key: StatusFilterType; label: string; adminOnly?: boolean }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Còn hạn" },
  { key: "expiring", label: "Sắp hết" },
  { key: "expired", label: "Đã hết" },
  { key: "frozen", label: "Bảo lưu" },
  { key: "transferred", label: "Đã chuyển" },
  { key: "deleted", label: "Đã xóa", adminOnly: true },
]

interface MembershipFilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  status: StatusFilterType
  onStatusChange: (s: StatusFilterType) => void
  isAdmin?: boolean
  tags?: MemberTag[]
  selectedTagIds?: string[]
  onTagIdsChange?: (ids: string[]) => void
}

export function MembershipFilterBar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  isAdmin = false,
  tags = [],
  selectedTagIds = [],
  onTagIdsChange,
}: MembershipFilterBarProps) {
  const { t } = useTranslation()
  const visibleTabs = FILTER_TABS.filter((tab) => !tab.adminOnly || isAdmin)
  const selectedTagId = selectedTagIds[0] ?? ""

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("memberships.search_placeholder", "Tìm theo tên hoặc số điện thoại...")}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {onTagIdsChange && tags.length > 0 && (
          <div className="relative shrink-0">
            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedTagId}
              onChange={(e) => onTagIdsChange(e.target.value ? [e.target.value] : [])}
              aria-label={t("tags.filter_label", "Lọc theo nhãn")}
              className="rounded-2xl border border-slate-200 bg-white py-2.5 pl-8 pr-8 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">{t("tags.all_tags", "Tất cả nhãn")}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/60">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              status === tab.key
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t(`memberships.tab_${tab.key}`, tab.label)}
          </button>
        ))}
      </div>
    </div>
  )
}

import { Search } from "lucide-react"
import type { StatusFilterType } from "../../lib/memberships"

const FILTER_TABS: { key: StatusFilterType; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Còn hạn" },
  { key: "expiring", label: "Sắp hết" },
  { key: "expired", label: "Đã hết" },
]

interface MembershipFilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  status: StatusFilterType
  onStatusChange: (s: StatusFilterType) => void
}

export function MembershipFilterBar({
  query,
  onQueryChange,
  status,
  onStatusChange,
}: MembershipFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/60">
        {FILTER_TABS.map((tab) => (
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
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

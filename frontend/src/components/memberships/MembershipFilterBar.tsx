import { Search } from "lucide-react"
import type { StatusFilterType } from "../../lib/memberships"

const STATUS_TABS: { key: StatusFilterType; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hoạt động" },
  { key: "expiring", label: "Sắp hết hạn" },
  { key: "expired", label: "Đã hết hạn" },
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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:bg-slate-950"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap rounded-xl border border-slate-200 p-1 dark:border-slate-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              status === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

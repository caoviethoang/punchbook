import type { KeyboardEvent, RefObject } from "react"
import { Loader2, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface CheckInSearchInputProps {
  inputRef: RefObject<HTMLInputElement | null>
  query: string
  onQueryChange: (q: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onClear: () => void
  isLoading: boolean
}

export function CheckInSearchInput({
  inputRef,
  query,
  onQueryChange,
  onKeyDown,
  onClear,
  isLoading,
}: CheckInSearchInputProps) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 h-5 w-5 text-slate-400"
        />

        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label={t("checkin.search_members_aria", "Tìm kiếm hội viên theo tên hoặc số điện thoại")}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("checkin.search_placeholder_example", "Nhập tên hoặc số điện thoại (ví dụ: 0901234567)...")}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 sm:py-3 sm:text-base"
        />

        {isLoading ? (
          <div role="status" aria-label={t("checkin.searching_status", "Đang tìm kiếm...")} className="absolute right-3.5">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={t("checkin.clear_search_aria", "Xóa nội dung tìm kiếm")}
            className="absolute right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

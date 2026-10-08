import type { KeyboardEvent, RefObject } from "react"
import { Loader2, Search, X } from "lucide-react"

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
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 h-6 w-6 text-slate-400"
        />

        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Tìm kiếm hội viên theo tên hoặc số điện thoại"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập tên hoặc số điện thoại (ví dụ: 0901234567)..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-lg font-medium text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 sm:py-5"
        />

        {isLoading ? (
          <div
            role="status"
            aria-label="Đang tìm kiếm..."
            className="absolute right-4"
          >
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Xóa nội dung tìm kiếm"
            className="absolute right-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

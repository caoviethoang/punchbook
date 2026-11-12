import { X } from "lucide-react"
import type { MemberTag } from "../../lib/tags"

interface TagPillProps {
  tag: Pick<MemberTag, "id" | "name" | "color">
  size?: "sm" | "md"
  onRemove?: (tagId: string) => void
  removeAriaLabel?: string
}

export function TagPill({ tag, size = "sm", onRemove, removeAriaLabel }: TagPillProps) {
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 ${paddingClass}`}
    >
      <svg className="h-2 w-2 shrink-0" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" fill={tag.color || "#6366f1"} />
      </svg>
      <span className="max-w-[140px] truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(tag.id)}
          aria-label={removeAriaLabel || `Remove ${tag.name}`}
          className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

import { useEffect, useState } from "react"
import { Check, Loader2, Plus, Tag as TagIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { createTag, listTags, TAG_COLOR_PRESETS, type MemberTag } from "../../lib/tags"
import { TagPill } from "./TagPill"

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  availableTags?: MemberTag[]
  onTagCreated?: (tag: MemberTag) => void
}

export function TagSelector({
  selectedTagIds,
  onChange,
  availableTags,
  onTagCreated,
}: TagSelectorProps) {
  const { t } = useTranslation()
  const [fetchedTags, setFetchedTags] = useState<MemberTag[]>([])
  const [loading, setLoading] = useState(!availableTags)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(TAG_COLOR_PRESETS[0])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (availableTags) return

    let active = true
    listTags()
      .then((items) => {
        if (!active) return
        setFetchedTags(items)
      })
      .catch(() => {
        // Gracefully allow quick-create even if initial list fails
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [availableTags])

  const tags = availableTags ?? fetchedTags
  const isLoading = availableTags ? false : loading

  const selectedSet = new Set(selectedTagIds)
  const selectedTags = tags.filter((tag) => selectedSet.has(tag.id))

  const toggleTag = (tagId: string) => {
    if (selectedSet.has(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleQuickCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return

    setCreating(true)
    setError(null)
    try {
      const created = await createTag({ name: trimmed, color: newColor })
      setFetchedTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      if (!selectedSet.has(created.id)) {
        onChange([...selectedTagIds, created.id])
      }
      onTagCreated?.(created)
      setNewName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tags.create_error", "Không thể tạo nhãn"))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <TagIcon className="h-3.5 w-3.5 text-indigo-500" />
          {t("tags.label", "Nhãn phân loại (Tags)")}
        </span>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              size="md"
              onRemove={toggleTag}
              removeAriaLabel={t("tags.remove_aria", {
                defaultValue: `Gỡ nhãn ${tag.name}`,
                name: tag.name,
              })}
            />
          ))}
        </div>
      )}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const isSelected = selectedSet.has(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <svg className="h-2 w-2 shrink-0" viewBox="0 0 8 8" aria-hidden="true">
                  <circle cx="4" cy="4" r="4" fill={tag.color || "#6366f1"} />
                </svg>
                <span>{tag.name}</span>
                {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
              </button>
            )
          })}
        </div>
      ) : (
        !isLoading && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t("tags.empty", "Chưa có nhãn nào. Tạo nhanh nhãn mới bên dưới.")}
          </p>
        )
      )}

      <div className="space-y-2 border-t border-slate-200/80 pt-2.5 dark:border-slate-700/70">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void handleQuickCreate()
              }
            }}
            placeholder={t("tags.quick_create_placeholder", "Tên nhãn mới (VD: VIP, Ca sáng)...")}
            aria-label={t("tags.quick_create_placeholder", "Tên nhãn mới")}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => void handleQuickCreate()}
            disabled={creating || !newName.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{t("tags.add_btn", "Thêm")}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {t("tags.color_label", "Màu:")}
          </span>
          {TAG_COLOR_PRESETS.map((color) => {
            const active = newColor === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                aria-label={t("tags.pick_color", { defaultValue: `Chọn màu ${color}`, color })}
                aria-pressed={active}
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                  active
                    ? "scale-110 border-slate-900 ring-2 ring-indigo-500/40 dark:border-white"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" fill={color} />
                </svg>
              </button>
            )
          })}
        </div>

        {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}

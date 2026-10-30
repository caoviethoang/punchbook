import { useState } from "react"
import { Check, Edit3, Loader2, NotebookPen, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface MembershipNotesSectionProps {
  notes?: string | null
  onSaveNotes: (notes: string) => Promise<unknown>
  isUpdating?: boolean
}

export function MembershipNotesSection({
  notes,
  onSaveNotes,
  isUpdating = false,
}: MembershipNotesSectionProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [draftNotes, setDraftNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    setDraftNotes(notes || "")
    setError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await onSaveNotes(draftNotes.trim())
      setIsEditing(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("member_detail.save_notes_failed", "Không thể lưu ghi chú. Vui lòng thử lại."),
      )
    }
  }

  function handleCancel() {
    setError(null)
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 shadow-sm dark:border-amber-800/80 dark:bg-amber-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <NotebookPen className="h-4 w-4" />
            <span>{t("member_detail.notes_title", "Ghi chú nội bộ")}</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t("member_detail.notes_hint", "Ctrl+Enter để lưu, Esc để hủy")}
          </span>
        </div>

        <textarea
          value={draftNotes}
          onChange={(e) => setDraftNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          rows={3}
          placeholder={t(
            "member_detail.notes_placeholder",
            "Nhập ghi chú riêng cho hội viên (dị ứng, sở thích, yêu cầu đặc biệt, lịch tập ưu tiên...)",
          )}
          className="mt-2.5 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-900/60 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        {error && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t("common.cancel", "Hủy")}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>
              {isUpdating
                ? t("member_detail.saving_notes", "Đang lưu...")
                : t("member_detail.save_notes", "Lưu ghi chú")}
            </span>
          </button>
        </div>
      </div>
    )
  }

  // Display mode: Prominent card if notes exist
  if (notes && notes.trim().length > 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition dark:border-amber-900/60 dark:bg-amber-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <NotebookPen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{t("member_detail.notes_title", "Ghi chú nội bộ")}</span>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
            title={t("member_detail.edit_notes_title", "Chỉnh sửa ghi chú")}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{t("common.edit", "Sửa")}</span>
          </button>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium text-slate-800 dark:text-slate-200">
          {notes}
        </p>
      </div>
    )
  }

  // Empty state: subtle dashed button to add note
  return (
    <div>
      <button
        type="button"
        onClick={startEditing}
        className="group inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-amber-400 hover:bg-amber-50/40 hover:text-amber-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
      >
        <Plus className="h-3.5 w-3.5 transition group-hover:scale-110" />
        <span>
          {t("member_detail.add_notes_prompt", "Thêm ghi chú nội bộ (dị ứng, yêu cầu đặc biệt...)")}
        </span>
      </button>
    </div>
  )
}

import { useState } from "react"
import { AlertCircle, Check, Edit2, Loader2, Plus, StickyNote, X } from "lucide-react"

interface MembershipNotesSectionProps {
  notes?: string | null
  onSaveNotes: (notes: string | null) => Promise<void>
}

export function MembershipNotesSection({ notes, onSaveNotes }: MembershipNotesSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(notes || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStartEdit() {
    setValue(notes || "")
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setValue(notes || "")
    setError(null)
    setIsEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const trimmed = value.trim()
      await onSaveNotes(trimmed ? trimmed : null)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu ghi chú.")
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Ghi chú nội bộ cho nhân viên
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Đóng chỉnh sửa ghi chú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
            rows={3}
            placeholder="Nhập ghi chú (dị ứng, yêu cầu đặc biệt, lịch tập ưu tiên...)"
            className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-800/80 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            * Chỉ hiển thị nội bộ cho nhân viên, không in ra phiếu POS.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Lưu ghi chú</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (notes && notes.trim()) {
    return (
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 shadow-xs dark:border-amber-800/60 dark:bg-amber-950/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Ghi chú nội bộ
            </span>
          </div>
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
            aria-label="Chỉnh sửa ghi chú"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Sửa</span>
          </button>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
          {notes}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        <span>Chưa có ghi chú nội bộ cho hội viên này</span>
      </div>
      <button
        type="button"
        onClick={handleStartEdit}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm ghi chú</span>
      </button>
    </div>
  )
}

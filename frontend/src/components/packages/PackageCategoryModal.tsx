import React, { useState } from "react"
import { AlertCircle, Check, Edit2, Loader2, Plus, Tag, Trash2, X } from "lucide-react"
import {
  createPackageCategory,
  deletePackageCategory,
  updatePackageCategory,
  type PackageCategory,
  type PackageItem,
} from "../../lib/packages"
import { FORM_CONTROL_CLASS } from "../ui/FormField"
import { Modal } from "../ui/Modal"
import { cn } from "../../lib/utils"

interface CategoryManagerModalProps {
  isOpen: boolean
  categories: PackageCategory[]
  packages: PackageItem[]
  onClose: () => void
  onCategoryAdded: (cat: PackageCategory) => void
  onCategoryUpdated: (cat: PackageCategory) => void
  onCategoryDeleted: (id: string) => void
}

export function CategoryManagerModal({
  isOpen,
  categories,
  packages,
  onClose,
  onCategoryAdded,
  onCategoryUpdated,
  onCategoryDeleted,
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCatName.trim()
    if (!name) return
    setAdding(true)
    setError(null)
    try {
      const cat = await createPackageCategory(name)
      onCategoryAdded(cat)
      setNewCatName("")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Tạo loại bộ môn mới thất bại",
      )
    } finally {
      setAdding(false)
    }
  }

  function startEdit(cat: PackageCategory) {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setError(null)
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim()
    if (!name) return
    setSavingId(id)
    setError(null)
    try {
      const updated = await updatePackageCategory(id, name)
      onCategoryUpdated(updated)
      setEditingId(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cập nhật loại bộ môn thất bại",
      )
    } finally {
      setSavingId(null)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa bộ môn "${name}" không? Các gói thuộc bộ môn này sẽ được chuyển về "Chưa phân loại".`,
      )
    ) {
      return
    }
    setDeletingId(id)
    setError(null)
    try {
      await deletePackageCategory(id)
      onCategoryDeleted(id)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Xóa loại bộ môn thất bại",
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Quản lý Bộ môn / Loại dịch vụ
            </h3>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add new Category form */}
        <form onSubmit={handleAddCategory} className="mb-5 flex gap-2">
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Tên bộ môn mới (Fitness, Yoga...)"
            className={cn(FORM_CONTROL_CLASS, "text-sm")}
          />
          <button
            type="submit"
            disabled={adding || !newCatName.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Thêm</span>
          </button>
        </form>

        {/* Categories list */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Chưa có bộ môn nào. Hãy thêm bộ môn đầu tiên ở trên!
            </p>
          ) : (
            categories.map((cat) => {
              const packageCount = packages.filter(
                (p) => p.package_category_id === cat.id,
              ).length
              const isEditing = editingId === cat.id

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/80"
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className={cn(FORM_CONTROL_CLASS, "py-1 text-sm")}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={savingId === cat.id || !editingName.trim()}
                        className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {savingId === cat.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {packageCount} gói
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-800"
                          title="Đổi tên"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCategory(cat.id, cat.name)
                          }
                          disabled={deletingId === cat.id}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                          title="Xóa bộ môn"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}

import React, { useState } from "react"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  FolderTree,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  createPackageCategory,
  deletePackageCategory,
  updatePackageCategory,
  type PackageCategory,
  type PackageItem,
} from "../../lib/packages"
import { FORM_CONTROL_CLASS } from "../ui/FormField"
import { cn } from "../../lib/utils"

export interface PackageCategorySectionProps {
  categories: PackageCategory[]
  packages: PackageItem[]
  onCategoryAdded: (cat: PackageCategory) => void
  onCategoryUpdated: (cat: PackageCategory) => void
  onCategoryDeleted: (id: string) => void
}

export function PackageCategorySection({
  categories,
  packages,
  onCategoryAdded,
  onCategoryUpdated,
  onCategoryDeleted,
}: PackageCategorySectionProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(true)
  const [newCatName, setNewCatName] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : "Tạo danh mục mới thất bại")
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
      setError(err instanceof Error ? err.message : "Cập nhật danh mục thất bại")
    } finally {
      setSavingId(null)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa danh mục "${name}" không? Các gói thuộc danh mục này sẽ được chuyển về "Chưa phân loại".`,
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
      setError(err instanceof Error ? err.message : "Xóa danh mục thất bại")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section
      aria-label={t("packages.categories", "Quản lý danh mục gói tập")}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("packages.categories", "Danh mục gói tập")}
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t("packages.categories_count", "{{count}} danh mục", { count: categories.length })}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "packages.categories_desc",
                "Quản lý các môn tập và phân loại gói dịch vụ (Fitness, Yoga, Boxing...)",
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? t("common.collapse", "Thu gọn") : t("common.expand", "Mở rộng")}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form tạo mới danh mục */}
          <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t(
                  "packages.new_category_placeholder",
                  "Nhập tên danh mục mới (ví dụ: Fitness, Yoga, Boxing, Pilates...)",
                )}
                className={cn(FORM_CONTROL_CLASS, "text-sm")}
                aria-label="Tên danh mục mới"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newCatName.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{t("packages.add_category_btn", "Thêm danh mục")}</span>
            </button>
          </form>

          {/* Danh sách danh mục */}
          {categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              {t(
                "packages.empty_categories",
                'Chưa có danh mục nào. Hãy nhập tên và bấm "Thêm danh mục" ở trên để bắt đầu!',
              )}
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const packageCount = packages.filter((p) => p.package_category_id === cat.id).length
                const isEditing = editingId === cat.id

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className={cn(FORM_CONTROL_CLASS, "py-1 text-sm")}
                          aria-label={`Sửa tên danh mục ${cat.name}`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={savingId === cat.id || !editingName.trim()}
                          className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500 disabled:opacity-50"
                          title="Lưu thay đổi"
                          aria-label="Lưu thay đổi"
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
                          className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Hủy sửa"
                          aria-label="Hủy sửa"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
                            title={cat.name}
                          >
                            {cat.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {t("packages.packages_count_unit", "{{count}} gói", {
                              count: packageCount,
                            })}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                            title={t("packages.edit_category_named", `Sửa danh mục ${cat.name}`, {
                              name: cat.name,
                            })}
                            aria-label={t(
                              "packages.edit_category_named",
                              `Sửa danh mục ${cat.name}`,
                              { name: cat.name },
                            )}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            disabled={deletingId === cat.id}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                            title={t("packages.delete_category_named", `Xóa danh mục ${cat.name}`, {
                              name: cat.name,
                            })}
                            aria-label={t(
                              "packages.delete_category_named",
                              `Xóa danh mục ${cat.name}`,
                              { name: cat.name },
                            )}
                          >
                            {deletingId === cat.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

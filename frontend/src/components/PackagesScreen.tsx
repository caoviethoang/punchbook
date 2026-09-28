import React, { useEffect, useState } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Edit2,
  Filter,
  Loader2,
  Package as PackageIcon,
  Plus,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import {
  createPackage,
  createPackageCategory,
  deletePackage,
  deletePackageCategory,
  listPackageCategories,
  listPackages,
  updatePackage,
  updatePackageCategory,
  type PackageCategory,
  type PackageItem,
  type PackageType,
} from "../lib/packages"
import { formatVndInput } from "../lib/formatters"
import { FormField, FORM_CONTROL_CLASS } from "./ui/FormField"
import { Modal } from "./ui/Modal"
import { Toast } from "./ui/Toast"
import { cn } from "../lib/utils"

const typeButtonClass = (active: boolean) =>
  `flex items-center justify-center rounded-xl border py-2.5 px-4 text-sm font-semibold transition ${
    active
      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60"
  }`

const DURATION_PRESETS = [
  { label: "1 ngày (Gói lẻ)", days: 1 },
  { label: "1 tháng (30 ngày)", days: 30 },
  { label: "2 tháng (60 ngày)", days: 60 },
  { label: "3 tháng (90 ngày)", days: 90 },
  { label: "6 tháng (180 ngày)", days: 180 },
  { label: "1 năm (365 ngày)", days: 365 },
]

function formatPackageDuration(pkg: PackageItem): string {
  if (pkg.sessions_count !== null) {
    return `${pkg.sessions_count} buổi`
  }
  const days = pkg.duration_days ?? 0
  if (days === 1) return "1 ngày (Gói lẻ)"
  if (days === 30) return "30 ngày (1 tháng)"
  if (days === 60) return "60 ngày (2 tháng)"
  if (days === 90) return "90 ngày (3 tháng - Mua 3+1)"
  if (days === 180) return "180 ngày (6 tháng)"
  if (days === 365) return "365 ngày (1 năm)"
  if (days % 30 === 0) return `${days} ngày (${days / 30} tháng)`
  return `${days} ngày`
}

function formatPackageTypeBadge(pkg: PackageItem): string {
  if (pkg.sessions_count !== null) return "Theo buổi"
  const days = pkg.duration_days ?? 0
  if (days === 1) return "Gói 1 ngày"
  if (days === 30) return "Gói 1 tháng"
  if (days === 60) return "Gói 2 tháng"
  if (days === 90) return "Gói 3 tháng"
  if (days === 180) return "Gói 6 tháng"
  if (days === 365) return "Gói 1 năm"
  if (days % 30 === 0) return `Gói ${days / 30} tháng`
  return `${days} ngày`
}

/* Category Manager Modal */
interface CategoryManagerModalProps {
  isOpen: boolean
  categories: PackageCategory[]
  packages: PackageItem[]
  onClose: () => void
  onCategoryAdded: (cat: PackageCategory) => void
  onCategoryUpdated: (cat: PackageCategory) => void
  onCategoryDeleted: (id: string) => void
}

function CategoryManagerModal({
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

/* Package Form Modal */
interface PackageFormModalProps {
  isOpen: boolean
  editingPackage: PackageItem | null
  categories: PackageCategory[]
  onClose: () => void
  onSuccess: (pkg: PackageItem, isEdit: boolean) => void
  onCategoryCreated: (cat: PackageCategory) => void
}

function PackageFormContent({
  editingPackage,
  categories,
  onClose,
  onSuccess,
  onCategoryCreated,
}: {
  editingPackage: PackageItem | null
  categories: PackageCategory[]
  onClose: () => void
  onSuccess: (pkg: PackageItem, isEdit: boolean) => void
  onCategoryCreated: (cat: PackageCategory) => void
}) {
  const [name, setName] = useState(editingPackage?.name ?? "")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    editingPackage?.package_category_id ?? "",
  )
  const [showNewCatInput, setShowNewCatInput] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [creatingCat, setCreatingCat] = useState(false)

  const [packageType, setPackageType] = useState<PackageType>(
    editingPackage?.duration_days ? "days" : "sessions",
  )
  const [sessionsCount, setSessionsCount] = useState<string>(
    editingPackage?.sessions_count ? String(editingPackage.sessions_count) : "10",
  )
  const [durationDays, setDurationDays] = useState<string>(
    editingPackage?.duration_days ? String(editingPackage.duration_days) : "30",
  )
  const [price, setPrice] = useState<string>(
    editingPackage?.price ? String(editingPackage.price) : "",
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPrice(e.target.value.replace(/\D/g, ""))
  }

  async function handleCreateCategory() {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    setCreatingCat(true)
    try {
      const cat = await createPackageCategory(trimmed)
      onCategoryCreated(cat)
      setSelectedCategoryId(cat.id)
      setNewCatName("")
      setShowNewCatInput(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Tạo loại dịch vụ mới thất bại",
      )
    } finally {
      setCreatingCat(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Vui lòng nhập tên gói")
      return
    }

    const parsedPrice = parseInt(price, 10)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Vui lòng nhập giá hợp lệ (≥ 0 VNĐ)")
      return
    }

    let payloadSessions: number | undefined
    let payloadDays: number | undefined

    if (packageType === "sessions") {
      const parsedSessions = parseInt(sessionsCount, 10)
      if (isNaN(parsedSessions) || parsedSessions <= 0) {
        setError("Vui lòng nhập số buổi hợp lệ (> 0)")
        return
      }
      payloadSessions = parsedSessions
    } else {
      const parsedDays = parseInt(durationDays, 10)
      if (isNaN(parsedDays) || parsedDays <= 0) {
        setError("Vui lòng nhập số ngày hợp lệ (> 0)")
        return
      }
      payloadDays = parsedDays
    }

    setLoading(true)

    try {
      const payload = {
        name: trimmedName,
        price: parsedPrice,
        sessions_count: payloadSessions,
        duration_days: payloadDays,
        package_category_id: selectedCategoryId || null,
      }

      let result: PackageItem
      if (editingPackage) {
        result = await updatePackage(editingPackage.id, payload)
        onSuccess(result, true)
      } else {
        result = await createPackage(payload)
        onSuccess(result, false)
      }
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingPackage
          ? "Cập nhật gói thất bại"
          : "Tạo gói thất bại",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {editingPackage ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {editingPackage
              ? "Cập nhật tên, bộ môn, loại gói hoặc giá của gói dịch vụ"
              : "Điền thông tin để tạo gói tập / lượt dịch vụ cho cửa hàng"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Package Category Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Loại môn / Bộ môn
            </label>
            <button
              type="button"
              onClick={() => setShowNewCatInput(!showNewCatInput)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {showNewCatInput ? "Chọn danh mục có sẵn" : "+ Thêm bộ môn mới"}
            </button>
          </div>

          {showNewCatInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ví dụ: Fitness, Yoga, Boxing, Swimming..."
                className={FORM_CONTROL_CLASS}
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCat || !newCatName.trim()}
                className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {creatingCat ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          ) : (
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className={FORM_CONTROL_CLASS}
            >
              <option value="">-- Chưa chọn bộ môn --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <FormField
          label="Tên gói"
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Fitness 1 tháng, Gói lẻ 1 ngày, Yoga 10 buổi..."
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Loại gói <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPackageType("sessions")}
              className={typeButtonClass(packageType === "sessions")}
            >
              Theo buổi
            </button>
            <button
              type="button"
              onClick={() => setPackageType("days")}
              className={typeButtonClass(packageType === "days")}
            >
              Theo ngày / tháng
            </button>
          </div>
        </div>

        {packageType === "sessions" ? (
          <FormField
            label="Số buổi"
            required
            type="number"
            min="1"
            value={sessionsCount}
            onChange={(e) => setSessionsCount(e.target.value)}
            placeholder="10"
          />
        ) : (
          <div className="space-y-2">
            <FormField
              label="Số ngày"
              required
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="30"
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Gợi ý chọn nhanh thời hạn:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((preset) => {
                  const isActive = String(preset.days) === durationDays
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setDurationDays(String(preset.days))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Giá (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={price ? formatVndInput(price) : ""}
              onChange={handlePriceChange}
              placeholder="500.000"
              className={cn(FORM_CONTROL_CLASS, "pr-14")}
            />
            <span className="pointer-events-none absolute right-3.5 top-2.5 text-sm font-medium text-slate-400">
              VNĐ
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{editingPackage ? "Đang lưu..." : "Đang tạo..."}</span>
              </>
            ) : editingPackage ? (
              "Lưu thay đổi"
            ) : (
              "Tạo gói"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function PackageFormModal({
  isOpen,
  editingPackage,
  categories,
  onClose,
  onSuccess,
  onCategoryCreated,
}: PackageFormModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <PackageFormContent
        key={editingPackage ? editingPackage.id : "new"}
        editingPackage={editingPackage}
        categories={categories}
        onClose={onClose}
        onSuccess={onSuccess}
        onCategoryCreated={onCategoryCreated}
      />
    </Modal>
  )
}

export function PackagesScreen() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all")

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(
    null,
  )

  const [deletingPackage, setDeletingPackage] = useState<PackageItem | null>(
    null,
  )
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [toast, setToast] = useState<{
    message: string
    type?: "success" | "error"
  } | null>(null)

  useEffect(() => {
    let isCancelled = false

    Promise.all([listPackages(), listPackageCategories()])
      .then(([pkgsData, catsData]) => {
        if (!isCancelled) {
          setPackages(pkgsData)
          setCategories(catsData)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải dữ liệu gói dịch vụ",
          )
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  function handleOpenCreate() {
    setEditingPackage(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(pkg: PackageItem) {
    setEditingPackage(pkg)
    setIsModalOpen(true)
  }

  function handleFormSuccess(pkg: PackageItem, isEdit: boolean) {
    if (isEdit) {
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)))
      setToast({
        message: `Đã cập nhật gói "${pkg.name}" thành công!`,
        type: "success",
      })
    } else {
      setPackages((prev) => [pkg, ...prev])
      setToast({
        message: `Đã tạo gói mới "${pkg.name}" thành công!`,
        type: "success",
      })
    }
  }

  function handleCategoryCreated(cat: PackageCategory) {
    setCategories((prev) => [...prev, cat])
    setToast({
      message: `Đã thêm bộ môn "${cat.name}"!`,
      type: "success",
    })
  }

  function handleCategoryUpdated(cat: PackageCategory) {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)))
    setPackages((prev) =>
      prev.map((p) =>
        p.package_category_id === cat.id ? { ...p, category_name: cat.name } : p,
      ),
    )
    setToast({
      message: `Đã đổi tên bộ môn thành "${cat.name}"!`,
      type: "success",
    })
  }

  function handleCategoryDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setPackages((prev) =>
      prev.map((p) =>
        p.package_category_id === id
          ? { ...p, package_category_id: null, category_name: null }
          : p,
      ),
    )
    if (selectedCategoryFilter === id) {
      setSelectedCategoryFilter("all")
    }
    setToast({
      message: "Đã xóa bộ môn!",
      type: "success",
    })
  }

  async function handleDeleteConfirm() {
    if (!deletingPackage) return
    setDeleteLoading(true)
    try {
      await deletePackage(deletingPackage.id)
      setPackages((prev) => prev.filter((p) => p.id !== deletingPackage.id))
      setToast({
        message: `Đã xóa gói "${deletingPackage.name}"`,
        type: "success",
      })
      setDeletingPackage(null)
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Xóa gói dịch vụ thất bại",
        type: "error",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filter packages based on category tab
  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategoryFilter === "all") return true
    if (selectedCategoryFilter === "uncategorized")
      return !pkg.package_category_id
    return pkg.package_category_id === selectedCategoryFilter
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <PackageIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Gói Dịch Vụ
          </h2>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Quản lý các gói tập và lượt dịch vụ dành cho hội viên cửa hàng
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Quản lý bộ môn</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo gói mới</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1 shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span>Bộ môn:</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedCategoryFilter("all")}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            selectedCategoryFilter === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <span>Tất cả môn</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              selectedCategoryFilter === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {packages.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = packages.filter(
            (p) => p.package_category_id === cat.id,
          ).length
          const isActive = selectedCategoryFilter === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 h-5 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
              <div className="mt-6 h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <PackageIcon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {packages.length === 0
              ? "Chưa có gói dịch vụ nào"
              : "Không tìm thấy gói thuộc môn tập này"}
          </h3>
          <p className="mt-2 max-w-sm text-base text-slate-500 dark:text-slate-400">
            {packages.length === 0
              ? "Hãy tạo gói dịch vụ đầu tiên để áp dụng khi tạo thẻ hội viên mới."
              : "Thử chọn bộ môn khác hoặc tạo gói mới cho bộ môn này."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-indigo-500"
          >
            <Plus className="h-5 w-5" />
            Tạo gói ngay
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => {
            const isSessionType = pkg.sessions_count !== null
            const badgeLabel = formatPackageTypeBadge(pkg)
            const durationLabel = formatPackageDuration(pkg)

            return (
              <div
                key={pkg.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/60"
              >
                <div>
                  {pkg.category_name && (
                    <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Tag className="h-3 w-3" />
                      <span>{pkg.category_name}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {pkg.name}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isSessionType
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {isSessionType ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      <span>{badgeLabel}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {formatVndInput(String(pkg.price))}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      VNĐ
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Thời hạn / Số lượng:{" "}
                    <strong className="font-semibold text-slate-900 dark:text-slate-200">
                      {durationLabel}
                    </strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    title="Chỉnh sửa gói"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingPackage(pkg)}
                    title="Xóa gói dịch vụ"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        categories={categories}
        packages={packages}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoryAdded={handleCategoryCreated}
        onCategoryUpdated={handleCategoryUpdated}
        onCategoryDeleted={handleCategoryDeleted}
      />

      {/* Create / Edit Form Modal */}
      <PackageFormModal
        isOpen={isModalOpen}
        editingPackage={editingPackage}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFormSuccess}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingPackage !== null}
        onClose={() => setDeletingPackage(null)}
        maxWidthClass="max-w-md"
      >
        {deletingPackage && (
          <div className="p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Xác nhận xóa gói
              </h3>
            </div>

            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa gói dịch vụ{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                &ldquo;{deletingPackage.name}&rdquo;
              </strong>{" "}
              không? Các hội viên đang sử dụng gói này sẽ không bị ảnh hưởng.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                disabled={deleteLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa gói"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

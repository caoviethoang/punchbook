import React, { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  createPackage,
  createPackageCategory,
  updatePackage,
  type PackageCategory,
  type PackageItem,
  type PackageType,
} from "../../lib/packages"
import { formatVndInput } from "../../lib/formatters"
import { FormField, FORM_CONTROL_CLASS } from "../ui/FormField"
import { Modal } from "../ui/Modal"
import { cn } from "../../lib/utils"

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

export interface PackageFormModalProps {
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

export function PackageFormModal({
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

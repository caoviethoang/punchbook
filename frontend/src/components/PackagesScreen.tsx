import { useEffect, useState } from "react"
import {
  AlertCircle,
  Filter,
  Loader2,
  Package as PackageIcon,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react"
import {
  deletePackage,
  listPackageCategories,
  listPackages,
  type PackageCategory,
  type PackageItem,
} from "../lib/packages"
import { CategoryManagerModal } from "./packages/PackageCategoryModal"
import { PackageFormModal } from "./packages/PackageFormModal"
import { PackageGrid } from "./packages/PackageTable"
import { Modal } from "./ui/Modal"
import { Toast } from "./ui/Toast"

export function PackagesScreen() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all")

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)

  const [deletingPackage, setDeletingPackage] = useState<PackageItem | null>(null)
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
      <PackageGrid
        loading={loading}
        packages={packages}
        filteredPackages={filteredPackages}
        onOpenCreate={handleOpenCreate}
        onOpenEdit={handleOpenEdit}
        onDeleteRequest={(pkg) => setDeletingPackage(pkg)}
      />

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

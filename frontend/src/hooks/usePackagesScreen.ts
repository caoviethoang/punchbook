import { useEffect, useMemo, useState } from "react"
import {
  deletePackage,
  listPackageCategories,
  listPackages,
  type PackageCategory,
  type PackageItem,
} from "../lib/packages"

export interface ToastState {
  message: string
  type?: "success" | "error"
}

export type PackageSortOption = "category" | "name" | "price_asc" | "price_desc"

export function usePackagesScreen() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<PackageSortOption>("category")

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)

  const [deletingPackage, setDeletingPackage] = useState<PackageItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [toast, setToast] = useState<ToastState | null>(null)

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
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu gói dịch vụ")
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
      prev.map((p) => (p.package_category_id === cat.id ? { ...p, category_name: cat.name } : p)),
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
        p.package_category_id === id ? { ...p, package_category_id: null, category_name: null } : p,
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
        message: err instanceof Error ? err.message : "Xóa gói dịch vụ thất bại",
        type: "error",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filter and sort packages based on category tab and sort option
  const filteredPackages = useMemo(() => {
    const filtered = packages.filter((pkg) => {
      if (selectedCategoryFilter === "all") return true
      if (selectedCategoryFilter === "uncategorized") return !pkg.package_category_id
      return pkg.package_category_id === selectedCategoryFilter
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === "category") {
        const catA = a.category_name || "\uffff"
        const catB = b.category_name || "\uffff"
        const catCompare = catA.localeCompare(catB, "vi")
        if (catCompare !== 0) return catCompare
        return a.name.localeCompare(b.name, "vi")
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi")
      }
      if (sortBy === "price_asc") {
        return a.price - b.price
      }
      if (sortBy === "price_desc") {
        return b.price - a.price
      }
      return 0
    })
  }, [packages, selectedCategoryFilter, sortBy])

  return {
    packages,
    categories,
    loading,
    error,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    sortBy,
    setSortBy,
    isCategoryManagerOpen,
    setIsCategoryManagerOpen,
    isModalOpen,
    setIsModalOpen,
    editingPackage,
    deletingPackage,
    setDeletingPackage,
    deleteLoading,
    toast,
    setToast,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSuccess,
    handleCategoryCreated,
    handleCategoryUpdated,
    handleCategoryDeleted,
    handleDeleteConfirm,
    filteredPackages,
  }
}

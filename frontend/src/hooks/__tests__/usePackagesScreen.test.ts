import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { usePackagesScreen } from "../usePackagesScreen"
import * as packagesApi from "../../lib/packages"
import type { PackageCategory, PackageItem } from "../../lib/packages"

const dummyCategories: PackageCategory[] = [
  { id: "cat-yoga", shop_id: "shop-1", name: "Yoga" },
  { id: "cat-boxing", shop_id: "shop-1", name: "Boxing" },
]

const dummyPackages: PackageItem[] = [
  {
    id: "pkg-1",
    name: "Yoga 1 tháng",
    price: 600000,
    sessions_count: null,
    duration_days: 30,
    package_category_id: "cat-yoga",
    category_name: "Yoga",
  },
  {
    id: "pkg-2",
    name: "Boxing 10 buổi",
    price: 1200000,
    sessions_count: 10,
    duration_days: null,
    package_category_id: "cat-boxing",
    category_name: "Boxing",
  },
  {
    id: "pkg-3",
    name: "Gói lẻ 1 ngày",
    price: 50000,
    sessions_count: null,
    duration_days: 1,
    package_category_id: null,
    category_name: null,
  },
]

describe("usePackagesScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(packagesApi, "listPackages").mockResolvedValue(dummyPackages)
    vi.spyOn(packagesApi, "listPackageCategories").mockResolvedValue(dummyCategories)
  })

  it("fetches packages and categories on mount", async () => {
    const { result } = renderHook(() => usePackagesScreen())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.packages).toHaveLength(3)
    expect(result.current.categories).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it("sorts packages by category by default and allows changing sort option", async () => {
    const { result } = renderHook(() => usePackagesScreen())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.sortBy).toBe("category")
    // Boxing -> Yoga -> Chưa phân loại
    expect(result.current.filteredPackages.map((p) => p.name)).toEqual([
      "Boxing 10 buổi",
      "Yoga 1 tháng",
      "Gói lẻ 1 ngày",
    ])

    // Change to sort by name
    act(() => {
      result.current.setSortBy("name")
    })
    expect(result.current.filteredPackages.map((p) => p.name)).toEqual([
      "Boxing 10 buổi",
      "Gói lẻ 1 ngày",
      "Yoga 1 tháng",
    ])

    // Change to sort by price ascending
    act(() => {
      result.current.setSortBy("price_asc")
    })
    expect(result.current.filteredPackages.map((p) => p.name)).toEqual([
      "Gói lẻ 1 ngày",
      "Yoga 1 tháng",
      "Boxing 10 buổi",
    ])

    // Change to sort by price descending
    act(() => {
      result.current.setSortBy("price_desc")
    })
    expect(result.current.filteredPackages.map((p) => p.name)).toEqual([
      "Boxing 10 buổi",
      "Yoga 1 tháng",
      "Gói lẻ 1 ngày",
    ])
  })

  it("filters packages by category and uncategorized", async () => {
    const { result } = renderHook(() => usePackagesScreen())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Filter by Boxing
    act(() => {
      result.current.setSelectedCategoryFilter("cat-boxing")
    })
    expect(result.current.filteredPackages).toHaveLength(1)
    expect(result.current.filteredPackages[0].name).toBe("Boxing 10 buổi")

    // Filter by Uncategorized
    act(() => {
      result.current.setSelectedCategoryFilter("uncategorized")
    })
    expect(result.current.filteredPackages).toHaveLength(1)
    expect(result.current.filteredPackages[0].name).toBe("Gói lẻ 1 ngày")

    // Filter by All
    act(() => {
      result.current.setSelectedCategoryFilter("all")
    })
    expect(result.current.filteredPackages).toHaveLength(3)
  })

  it("handles category CRUD state updates correctly", async () => {
    const { result } = renderHook(() => usePackagesScreen())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Category created
    const newCat: PackageCategory = { id: "cat-pilates", shop_id: "shop-1", name: "Pilates" }
    act(() => {
      result.current.handleCategoryCreated(newCat)
    })
    expect(result.current.categories).toContainEqual(newCat)
    expect(result.current.toast?.message).toContain("Pilates")

    // Category updated
    const updatedCat: PackageCategory = { id: "cat-boxing", shop_id: "shop-1", name: "Kickboxing" }
    act(() => {
      result.current.handleCategoryUpdated(updatedCat)
    })
    expect(result.current.categories.find((c) => c.id === "cat-boxing")?.name).toBe("Kickboxing")
    expect(result.current.packages.find((p) => p.id === "pkg-2")?.category_name).toBe("Kickboxing")

    // Category deleted
    act(() => {
      result.current.handleCategoryDeleted("cat-yoga")
    })
    expect(result.current.categories.find((c) => c.id === "cat-yoga")).toBeUndefined()
    expect(result.current.packages.find((p) => p.id === "pkg-1")?.package_category_id).toBeNull()
  })

  it("deletes a package on handleDeleteConfirm", async () => {
    vi.spyOn(packagesApi, "deletePackage").mockResolvedValueOnce()
    const { result } = renderHook(() => usePackagesScreen())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setDeletingPackage(dummyPackages[0])
    })

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(packagesApi.deletePackage).toHaveBeenCalledWith("pkg-1")
    expect(result.current.packages.find((p) => p.id === "pkg-1")).toBeUndefined()
    expect(result.current.toast?.type).toBe("success")
  })
})

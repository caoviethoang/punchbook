import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { PackageCategorySection } from "../packages/PackageCategorySection"
import * as packagesApi from "../../lib/packages"
import type { PackageCategory, PackageItem } from "../../lib/packages"

const mockCategories: PackageCategory[] = [
  { id: "cat-1", shop_id: "shop-1", name: "Fitness" },
  { id: "cat-2", shop_id: "shop-1", name: "Yoga" },
]

const mockPackages: PackageItem[] = [
  {
    id: "pkg-1",
    name: "Fitness 1 tháng",
    price: 500000,
    sessions_count: null,
    duration_days: 30,
    package_category_id: "cat-1",
    category_name: "Fitness",
  },
  {
    id: "pkg-2",
    name: "Yoga 10 buổi",
    price: 800000,
    sessions_count: 10,
    duration_days: null,
    package_category_id: "cat-2",
    category_name: "Yoga",
  },
]

describe("PackageCategorySection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders list of categories with package count badges", () => {
    render(
      <PackageCategorySection
        categories={mockCategories}
        packages={mockPackages}
        onCategoryAdded={vi.fn()}
        onCategoryUpdated={vi.fn()}
        onCategoryDeleted={vi.fn()}
      />,
    )

    expect(screen.getByText("Danh mục gói tập")).toBeInTheDocument()
    expect(screen.getByText("2 danh mục")).toBeInTheDocument()
    expect(screen.getByText("Fitness")).toBeInTheDocument()
    expect(screen.getByText("Yoga")).toBeInTheDocument()
    expect(screen.getAllByText("1 gói")).toHaveLength(2)
  })

  it("renders empty state message when there are no categories", () => {
    render(
      <PackageCategorySection
        categories={[]}
        packages={[]}
        onCategoryAdded={vi.fn()}
        onCategoryUpdated={vi.fn()}
        onCategoryDeleted={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/Chưa có danh mục nào. Hãy nhập tên và bấm "Thêm danh mục"/i),
    ).toBeInTheDocument()
  })

  it("submits form to create a new category and calls onCategoryAdded", async () => {
    const onCategoryAdded = vi.fn()
    const newCat: PackageCategory = { id: "cat-3", shop_id: "shop-1", name: "Boxing" }
    vi.spyOn(packagesApi, "createPackageCategory").mockResolvedValueOnce(newCat)

    render(
      <PackageCategorySection
        categories={mockCategories}
        packages={mockPackages}
        onCategoryAdded={onCategoryAdded}
        onCategoryUpdated={vi.fn()}
        onCategoryDeleted={vi.fn()}
      />,
    )

    const input = screen.getByLabelText("Tên danh mục mới")
    fireEvent.change(input, { target: { value: "Boxing" } })

    const submitBtn = screen.getByRole("button", { name: /Thêm danh mục/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(packagesApi.createPackageCategory).toHaveBeenCalledWith("Boxing")
      expect(onCategoryAdded).toHaveBeenCalledWith(newCat)
    })
  })

  it("edits an existing category and calls onCategoryUpdated", async () => {
    const onCategoryUpdated = vi.fn()
    const updatedCat: PackageCategory = { id: "cat-1", shop_id: "shop-1", name: "Gym & Fitness" }
    vi.spyOn(packagesApi, "updatePackageCategory").mockResolvedValueOnce(updatedCat)

    render(
      <PackageCategorySection
        categories={mockCategories}
        packages={mockPackages}
        onCategoryAdded={vi.fn()}
        onCategoryUpdated={onCategoryUpdated}
        onCategoryDeleted={vi.fn()}
      />,
    )

    const editBtn = screen.getByRole("button", { name: "Sửa danh mục Fitness" })
    fireEvent.click(editBtn)

    const editInput = screen.getByLabelText("Sửa tên danh mục Fitness")
    fireEvent.change(editInput, { target: { value: "Gym & Fitness" } })

    const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(packagesApi.updatePackageCategory).toHaveBeenCalledWith("cat-1", "Gym & Fitness")
      expect(onCategoryUpdated).toHaveBeenCalledWith(updatedCat)
    })
  })

  it("deletes a category after confirmation and calls onCategoryDeleted", async () => {
    const onCategoryDeleted = vi.fn()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.spyOn(packagesApi, "deletePackageCategory").mockResolvedValueOnce()

    render(
      <PackageCategorySection
        categories={mockCategories}
        packages={mockPackages}
        onCategoryAdded={vi.fn()}
        onCategoryUpdated={vi.fn()}
        onCategoryDeleted={onCategoryDeleted}
      />,
    )

    const deleteBtn = screen.getByRole("button", { name: "Xóa danh mục Yoga" })
    fireEvent.click(deleteBtn)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Bạn có chắc chắn muốn xóa danh mục "Yoga" không?'),
    )

    await waitFor(() => {
      expect(packagesApi.deletePackageCategory).toHaveBeenCalledWith("cat-2")
      expect(onCategoryDeleted).toHaveBeenCalledWith("cat-2")
    })
  })

  it("allows toggling expand and collapse", () => {
    render(
      <PackageCategorySection
        categories={mockCategories}
        packages={mockPackages}
        onCategoryAdded={vi.fn()}
        onCategoryUpdated={vi.fn()}
        onCategoryDeleted={vi.fn()}
      />,
    )

    const toggleBtn = screen.getByRole("button", { name: /Thu gọn/i })
    fireEvent.click(toggleBtn)

    expect(screen.queryByLabelText("Tên danh mục mới")).not.toBeInTheDocument()

    const expandBtn = screen.getByRole("button", { name: /Mở rộng/i })
    fireEvent.click(expandBtn)

    expect(screen.getByLabelText("Tên danh mục mới")).toBeInTheDocument()
  })
})

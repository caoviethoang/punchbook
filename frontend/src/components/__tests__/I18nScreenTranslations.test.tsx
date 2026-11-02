import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import i18n from "../../i18n"
import { PackageCategoryFilter } from "../packages/PackageCategoryFilter"
import { PackageGrid } from "../packages/PackageTable"
import { MemberRemainingBadge } from "../memberships/MemberRemainingBadge"
import { CheckInHeader } from "../checkin/CheckInHeader"
import { RemainingIndicator } from "../checkin/CheckInSearchResults"
import { formatPackageDuration, formatPackageTypeBadge, type PackageItem } from "../../lib/packages"

describe("i18n screen translations when switched to English", () => {
  beforeEach(async () => {
    cleanup()
    await i18n.changeLanguage("en")
  })

  afterAll(async () => {
    await i18n.changeLanguage("vi")
  })

  it("translates package category filter labels into English", () => {
    render(
      <PackageCategoryFilter
        categories={[{ id: "cat-1", shop_id: "shop-1", name: "Yoga" }]}
        packages={[{ id: "p-1", name: "Basic", price: 100000, sessions_count: 5, duration_days: null }]}
        selectedCategory="all"
        onSelectCategory={() => {}}
        sortBy="category"
        onSortByChange={() => {}}
      />,
    )

    expect(screen.getByText("Discipline:")).toBeInTheDocument()
    expect(screen.getByText("All Disciplines")).toBeInTheDocument()
    expect(screen.getByText("Sort:")).toBeInTheDocument()
    expect(screen.getByText("By Category")).toBeInTheDocument()
  })

  it("translates package table elements and formatters into English", () => {
    const pkg: PackageItem = {
      id: "pkg-1",
      name: "Monthly Gym",
      price: 500000,
      sessions_count: null,
      duration_days: 30,
      category_name: null,
    }

    render(
      <PackageGrid
        loading={false}
        packages={[pkg]}
        filteredPackages={[pkg]}
        onOpenCreate={() => {}}
        onOpenEdit={() => {}}
        onDeleteRequest={() => {}}
      />,
    )

    expect(screen.getByText("Uncategorized")).toBeInTheDocument()
    expect(screen.getByText("Duration / Quantity:")).toBeInTheDocument()
    expect(screen.getByText("VND")).toBeInTheDocument()
    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getByText("Delete")).toBeInTheDocument()

    // Formatter helpers
    const t = i18n.t.bind(i18n) as unknown as Parameters<typeof formatPackageDuration>[1]
    expect(formatPackageDuration(pkg, t)).toBe("30 days (1 month)")
    expect(formatPackageTypeBadge(pkg, t)).toBe("1 Month")
  })

  it("translates member remaining badge into English", () => {
    const { rerender } = render(
      <MemberRemainingBadge
        membership={{
          id: "m-1",
          customer_name: "John",
          phone: "0123456789",
          sessions_left: 5,
          expires_at: null,
          package: { id: "p-1", name: "10 Sessions", sessions_count: 10 },
        }}
      />,
    )
    expect(screen.getByText("5/10 sessions left")).toBeInTheDocument()

    rerender(
      <MemberRemainingBadge
        membership={{
          id: "m-2",
          customer_name: "Jane",
          phone: "0123456789",
          sessions_left: 0,
          expires_at: null,
          package: { id: "p-1", name: "10 Sessions", sessions_count: 10 },
        }}
      />,
    )
    expect(screen.getByText("Exhausted (0/10)")).toBeInTheDocument()
  })

  it("translates check-in header and remaining indicators into English", () => {
    render(
      <CheckInHeader
        onOpenQRScanner={() => {}}
        isGroupMode={false}
        onToggleGroupMode={() => {}}
      />,
    )

    expect(screen.getByText(/ON-DUTY STAFF:/i)).toBeInTheDocument()
    expect(screen.getByText("Group Check-in")).toBeInTheDocument()

    render(
      <RemainingIndicator
        sessionsLeft={10}
        expiresAt={null}
      />,
    )
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText(/sessions left/i)).toBeInTheDocument()
  })
})

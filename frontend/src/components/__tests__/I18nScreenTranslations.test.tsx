import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import i18n from "../../i18n"
import { PackageCategoryFilter } from "../packages/PackageCategoryFilter"
import { PackageGrid } from "../packages/PackageTable"
import { MemberRemainingBadge } from "../memberships/MemberRemainingBadge"
import { CheckInHeader } from "../checkin/CheckInHeader"
import { RemainingIndicator, MembershipResultList } from "../checkin/CheckInSearchResults"
import { PackageRevenueChart } from "../analytics/PackageRevenueChart"
import { CheckInFrequencyChart } from "../analytics/CheckInFrequencyChart"
import { DashboardMembershipsTable } from "../dashboard/DashboardMembershipsTable"
import { DeviceIntegrationSection } from "../settings/DeviceIntegrationSection"
import { SubscriptionSection } from "../settings/SubscriptionSection"
import { AuditLogItem } from "../audit-logs/AuditLogItem"
import { FileDropzone } from "../import/FileDropzone"
import { ImportResultTable } from "../import/ImportResultTable"
import { formatPackageDuration, formatPackageTypeBadge, type PackageItem } from "../../lib/packages"
import type { Shop } from "../../lib/auth"

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

  it("translates PackageRevenueChart and CheckInFrequencyChart into English", () => {
    render(
      <PackageRevenueChart
        packageRevenue={[
          {
            package_id: "p-1",
            package_name: "Pro Package",
            sales_count: 5,
            invoices_count: 5,
            total_revenue: 10000000,
            percentage: 100,
          },
        ]}
      />,
    )

    expect(screen.getByText("Package Revenue This Month")).toBeInTheDocument()
    expect(screen.getByText("Total Sales")).toBeInTheDocument()
    expect(screen.getByText("Best-Selling Package")).toBeInTheDocument()
    expect(screen.getByText("Revenue Share by Package")).toBeInTheDocument()
    expect(screen.getByText("Service Package")).toBeInTheDocument()
    expect(screen.getByText("Sales Count")).toBeInTheDocument()
    expect(screen.getByText("Total Revenue")).toBeInTheDocument()
    expect(screen.getByText("Share")).toBeInTheDocument()

    cleanup()

    render(
      <CheckInFrequencyChart
        checkInFrequency={[{ hour: 2, label: "02:00 - 03:00", count: 25 }]}
        peakHour={{
          hour: 2,
          label: "02:00 - 03:00",
          count: 25,
          recommendation: "Khung giờ cao điểm: 02:00 - 03:00 (25 lượt). Khuyên dùng: Xếp thêm nhân viên phục vụ.",
        }}
      />,
    )

    expect(screen.getByText("Staff Scheduling Tip")).toBeInTheDocument()
    expect(
      screen.getByText(/Peak hours: 02:00 - 03:00 \(25 check-ins\)\. Recommendation: Schedule additional staff\./i),
    ).toBeInTheDocument()
  })

  it("translates DashboardMembershipsTable action buttons into English", () => {
    render(
      <DashboardMembershipsTable
        memberships={[
          {
            id: "m-1",
            customer_name: "Charlie Le",
            phone: "0987654321",
            status: "active",
            sessions_left: 10,
            expires_at: null,
            package: { id: "p-1", name: "Basic Package", sessions_count: 10 },
          },
        ]}
        paginationMeta={{ page: 1, per_page: 10, total: 1, total_pages: 1 }}
        searchQuery=""
        onSearchChange={() => {}}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        page={1}
        onPageChange={() => {}}
        listLoading={false}
        onSelectDetail={() => {}}
        onSelectRenewal={() => {}}
      />,
    )

    expect(screen.getByRole("button", { name: /Details/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Renew/i })).toBeInTheDocument()
  })

  it("translates DeviceIntegrationSection and SubscriptionSection into English", () => {
    const mockShop: Shop = {
      id: "shop-1",
      name: "PunchBook Studio 1",
      email: "owner@punchbook.vn",
      phone: "0901234569",
      address: "123 Street",
      bank_name: "TPBank",
      bank_account_no: "0123456789",
      bank_account_name: "CAO VIET HOANG",
      plan: "paid",
      plan_expires_at: "2026-12-31T23:59:59Z",
      device_api_key: "dev-key-123",
    }

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={() => {}}
        onToast={() => {}}
      />,
    )

    expect(screen.getByText("Device Check-in Endpoint")).toBeInTheDocument()
    expect(screen.getByText("Device API Key")).toBeInTheDocument()

    cleanup()

    render(
      <SubscriptionSection
        shop={mockShop}
        isAdmin={true}
        daysLeft={60}
        showRenewalButton={true}
        onOpenUpgradeModal={() => {}}
      />,
    )

    expect(screen.getByText("Email Account")).toBeInTheDocument()
    expect(screen.getByText("Service Plan Type")).toBeInTheDocument()
    expect(screen.getByText("Paid Plan")).toBeInTheDocument()
    expect(screen.getByText("Plan Expiration Date")).toBeInTheDocument()
  })

  it("translates MembershipResultList buttons (Renew & CI, Checked In) into English", () => {
    render(
      <MembershipResultList
        memberships={[
          {
            id: "m-1",
            customer_name: "John Doe",
            phone: "0123456789",
            sessions_left: 0,
            expires_at: null,
            package: { id: "p-1", name: "Basic", sessions_count: 10 },
          },
          {
            id: "m-2",
            customer_name: "Jane Doe",
            phone: "0987654321",
            sessions_left: 5,
            expires_at: null,
            checked_in_today: true,
            package: { id: "p-1", name: "Basic", sessions_count: 10 },
          },
        ]}
        checkingInId={null}
        checkInMessage={null}
        onCheckIn={() => {}}
        onRenew={() => {}}
        onViewDetail={() => {}}
      />,
    )

    expect(screen.getByRole("button", { name: /Renew and check-in for John Doe/i })).toBeInTheDocument()
    expect(screen.getByText("Renew & CI")).toBeInTheDocument()
    expect(screen.getAllByText("Checked In").length).toBeGreaterThanOrEqual(1)
  })

  it("translates AuditLogItem and audit descriptions into English", () => {
    render(
      <AuditLogItem
        log={{
          id: "log-1",
          staff_name: "Alice Nguyen (Admin)",
          target_type: "Membership",
          target_id: "m-1",
          action: "check_in",
          details: {
            membership_name: "Edward Hoang",
            package_name: "Monthly Package (30 days)",
            sessions_after: 10,
          },
          created_at: new Date().toISOString(),
        }}
      />,
    )

    expect(screen.getByText("Check-in")).toBeInTheDocument()
    expect(
      screen.getByText(/Member: Edward Hoang • Package: Monthly Package \(30 days\) • Remaining: 10 sessions/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/just now/i)).toBeInTheDocument()
  })

  it("translates FileDropzone and ImportResultTable into English", () => {
    render(
      <FileDropzone
        selectedFile={null}
        onFileSelect={() => {}}
        onReset={() => {}}
      />,
    )

    expect(screen.getByText(/Drag & drop files here, or/i)).toBeInTheDocument()
    expect(screen.getByText(/browse from your computer/i)).toBeInTheDocument()
    expect(screen.getByText(/Supported formats: \.xlsx, \.xls, \.csv/i)).toBeInTheDocument()

    cleanup()

    render(
      <ImportResultTable
        importResult={{
          total_rows: 5,
          success_count: 3,
          failed_count: 2,
          errors: [
            {
              row: 2,
              customer_name: "Invalid User",
              phone: "abc",
              error: "Invalid phone number",
            },
          ],
        }}
      />,
    )

    expect(screen.getByText("Total Rows")).toBeInTheDocument()
    expect(screen.getByText("Errors")).toBeInTheDocument()
    expect(screen.getByText("Error details (2)")).toBeInTheDocument()
    expect(screen.getByText("Row 2")).toBeInTheDocument()
  })
})

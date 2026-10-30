import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { AttendanceReportSection } from "../AttendanceReportSection"
import * as attendanceLib from "../../../lib/attendance"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const mockAttendanceData: attendanceLib.AttendanceReportResponse = {
  month: "2026-10",
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  summary: {
    total_members: 3,
    active_members_count: 2,
    inactive_members_count: 1,
    total_check_ins: 16,
    avg_check_ins_per_active_member: 8.0,
  },
  attendance: [
    {
      membership_id: "m-1",
      customer_name: "Nguyen Van A",
      phone: "0901111111",
      package_name: "Gói Gym 30 Ngày",
      status: "active",
      sessions_left: null,
      expires_at: "2026-11-01",
      check_ins_count: 12,
      last_check_in_at: "2026-10-25T14:30:00Z",
      is_inactive: false,
      rank: 1,
    },
    {
      membership_id: "m-2",
      customer_name: "Tran Thi B",
      phone: "0902222222",
      package_name: "Gói 10 Buổi",
      status: "active",
      sessions_left: 6,
      expires_at: null,
      check_ins_count: 4,
      last_check_in_at: "2026-10-20T10:00:00Z",
      is_inactive: false,
      rank: 2,
    },
    {
      membership_id: "m-3",
      customer_name: "Le Van C",
      phone: "0903333333",
      package_name: "Gói Gym 30 Ngày",
      status: "active",
      sessions_left: null,
      expires_at: "2026-11-01",
      check_ins_count: 0,
      last_check_in_at: null,
      is_inactive: true,
      rank: null,
    },
  ],
}

describe("AttendanceReportSection", () => {
  beforeEach(() => {
    vi.spyOn(attendanceLib, "getAttendanceReport").mockResolvedValue(mockAttendanceData)
  })

  it("renders header, summary metrics, and attendance leaderboard", async () => {
    render(<AttendanceReportSection />)

    expect(
      screen.getByRole("heading", { name: /Báo cáo chuyên cần hội viên/i }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
      expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
      expect(screen.getByText("Le Van C")).toBeInTheDocument()
    })

    // Rank badges
    expect(screen.getByText("🥇 #1")).toBeInTheDocument()
    expect(screen.getByText("🥈 #2")).toBeInTheDocument()

    // Monthly check-ins
    expect(screen.getByText("12 buổi")).toBeInTheDocument()
    expect(screen.getByText("4 buổi")).toBeInTheDocument()
    expect(screen.getByText("0 buổi")).toBeInTheDocument()

    // Clear indicator for inactive members (AC: Hội viên không check-in lần nào trong tháng được đánh dấu rõ ràng)
    expect(screen.getByText(/Chưa đi tập \(Nguy cơ\)/i)).toBeInTheDocument()
  })

  it("filters members when switching tabs", async () => {
    render(<AttendanceReportSection />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    // Click "Chưa tập buổi nào" tab
    const inactiveTab = screen.getByRole("button", { name: /Chưa tập buổi nào/i })
    fireEvent.click(inactiveTab)

    expect(screen.queryByText("Nguyen Van A")).not.toBeInTheDocument()
    expect(screen.queryByText("Tran Thi B")).not.toBeInTheDocument()
    expect(screen.getByText("Le Van C")).toBeInTheDocument()

    // Click "Chuyên cần" tab
    const activeTab = screen.getByRole("button", { name: /^Chuyên cần/i })
    fireEvent.click(activeTab)

    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
    expect(screen.queryByText("Le Van C")).not.toBeInTheDocument()
  })

  it("allows searching by customer name or phone", async () => {
    render(<AttendanceReportSection />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên, SĐT, gói.../i)
    fireEvent.change(searchInput, { target: { value: "0902222222" } })

    expect(screen.queryByText("Nguyen Van A")).not.toBeInTheDocument()
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
  })

  it("calls export when clicking 'Xuất Excel' button", async () => {
    const exportSpy = vi
      .spyOn(attendanceLib, "downloadAttendanceExcelReport")
      .mockResolvedValue(undefined)

    render(<AttendanceReportSection />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    const exportBtn = screen.getByRole("button", { name: /Xuất Excel/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith("2026-10")
    })
  })

  it("invokes onUpgradeRequired callback when export fails due to free plan limitation", async () => {
    vi.spyOn(attendanceLib, "downloadAttendanceExcelReport").mockRejectedValue(
      new Error("Gói Free không hỗ trợ xuất báo cáo Excel. Vui lòng nâng cấp gói trả phí."),
    )

    const onUpgradeRequiredMock = vi.fn()
    render(<AttendanceReportSection onUpgradeRequired={onUpgradeRequiredMock} />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    const exportBtn = screen.getByRole("button", { name: /Xuất Excel/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(onUpgradeRequiredMock).toHaveBeenCalled()
    })
  })

  it("calls onSelectDetail when clicking 'Xem' button", async () => {
    const onSelectDetailMock = vi.fn()
    render(<AttendanceReportSection onSelectDetail={onSelectDetailMock} />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    const viewButtons = screen.getAllByRole("button", { name: /Xem/i })
    fireEvent.click(viewButtons[0]!)

    expect(onSelectDetailMock).toHaveBeenCalledWith("m-1")
  })
})

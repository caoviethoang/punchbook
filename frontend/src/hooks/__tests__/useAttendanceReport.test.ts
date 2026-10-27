import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useAttendanceReport } from "../useAttendanceReport"
import * as attendanceLib from "../../lib/attendance"

vi.mock("../../lib/attendance", () => ({
  getAttendanceReport: vi.fn(),
  downloadAttendanceExcelReport: vi.fn(),
}))

const mockResponse: attendanceLib.AttendanceReportResponse = {
  month: "2026-10",
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  summary: {
    total_members: 3,
    active_members_count: 2,
    inactive_members_count: 1,
    total_check_ins: 15,
    avg_check_ins_per_active_member: 7.5,
  },
  attendance: [
    {
      membership_id: "m-1",
      customer_name: "Nguyen Van A",
      phone: "0901111111",
      package_name: "Gói 30 ngày",
      status: "active",
      sessions_left: null,
      expires_at: "2026-11-01",
      check_ins_count: 12,
      last_check_in_at: "2026-10-25T10:00:00Z",
      is_inactive: false,
      rank: 1,
    },
    {
      membership_id: "m-2",
      customer_name: "Tran Thi B",
      phone: "0902222222",
      package_name: "Gói 10 buổi",
      status: "active",
      sessions_left: 7,
      expires_at: null,
      check_ins_count: 3,
      last_check_in_at: "2026-10-10T10:00:00Z",
      is_inactive: false,
      rank: 2,
    },
    {
      membership_id: "m-3",
      customer_name: "Le Van C",
      phone: "0903333333",
      package_name: "Gói 30 ngày",
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

describe("useAttendanceReport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(attendanceLib.getAttendanceReport).mockResolvedValue(mockResponse)
  })

  it("loads report on mount with initial month", async () => {
    const { result } = renderHook(() => useAttendanceReport("2026-10"))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toEqual(mockResponse)
    })

    expect(attendanceLib.getAttendanceReport).toHaveBeenCalledWith("2026-10")
    expect(result.current.filteredRecords.length).toBe(3)
  })

  it("filters records by tab (active vs inactive)", async () => {
    const { result } = renderHook(() => useAttendanceReport("2026-10"))

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    act(() => {
      result.current.setFilterTab("active")
    })
    expect(result.current.filteredRecords.length).toBe(2)
    expect(result.current.filteredRecords.every((r) => !r.is_inactive)).toBe(true)

    act(() => {
      result.current.setFilterTab("inactive")
    })
    expect(result.current.filteredRecords.length).toBe(1)
    expect(result.current.filteredRecords[0]?.customer_name).toBe("Le Van C")
  })

  it("filters records by search query", async () => {
    const { result } = renderHook(() => useAttendanceReport("2026-10"))

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    act(() => {
      result.current.setSearchQuery("0902222222")
    })
    expect(result.current.filteredRecords.length).toBe(1)
    expect(result.current.filteredRecords[0]?.customer_name).toBe("Tran Thi B")
  })

  it("navigates to previous and next months", async () => {
    const { result } = renderHook(() => useAttendanceReport("2026-10"))

    act(() => {
      result.current.prevMonth()
    })
    expect(result.current.month).toBe("2026-09")

    act(() => {
      result.current.nextMonth()
    })
    expect(result.current.month).toBe("2026-10")
  })

  it("handles export successfully", async () => {
    vi.mocked(attendanceLib.downloadAttendanceExcelReport).mockResolvedValue(undefined)
    const { result } = renderHook(() => useAttendanceReport("2026-10"))

    await act(async () => {
      await result.current.handleExport()
    })

    expect(attendanceLib.downloadAttendanceExcelReport).toHaveBeenCalledWith("2026-10")
    expect(result.current.exportError).toBeNull()
  })
})

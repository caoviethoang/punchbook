import { describe, it, expect, vi, beforeEach } from "vitest"
import * as api from "../api"
import { getAttendanceReport, downloadAttendanceExcelReport } from "../attendance"

vi.mock("../api", () => ({
  apiGet: vi.fn(),
  downloadBlob: vi.fn(),
}))

describe("attendance API library", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getAttendanceReport calls /reports/attendance with month parameter", async () => {
    const mockData = {
      month: "2026-10",
      start_date: "2026-10-01",
      end_date: "2026-10-31",
      summary: {
        total_members: 10,
        active_members_count: 8,
        inactive_members_count: 2,
        total_check_ins: 35,
        avg_check_ins_per_active_member: 4.4,
      },
      attendance: [],
    }
    vi.mocked(api.apiGet).mockResolvedValue(mockData)

    const result = await getAttendanceReport("2026-10")

    expect(api.apiGet).toHaveBeenCalledWith("/reports/attendance", {
      query: { month: "2026-10" },
    })
    expect(result).toEqual(mockData)
  })

  it("downloadAttendanceExcelReport calls downloadBlob with export path and filename", async () => {
    vi.mocked(api.downloadBlob).mockResolvedValue(undefined)

    await downloadAttendanceExcelReport("2026-10")

    expect(api.downloadBlob).toHaveBeenCalledWith(
      "/reports/attendance/export?month=2026-10",
      "punchbook_attendance_2026-10.xlsx",
    )
  })
})

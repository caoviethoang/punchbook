import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { TrainerCommissionReportSection } from "../TrainerCommissionReportSection"
import * as commissionsApi from "../../../lib/trainerCommissions"
import * as staffsApi from "../../../lib/staffs"
import type { Staff } from "../../../lib/auth"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("TrainerCommissionReportSection", () => {
  const mockTrainers: staffsApi.TrainerOption[] = [
    { id: "tr-1", name: "HLV Tuan Kiet", role: "trainer" },
    { id: "tr-2", name: "HLV Lan Anh", role: "trainer" },
  ]

  const mockReport: commissionsApi.TrainerCommissionReportResponse = {
    month: "2026-11",
    start_date: "2026-11-01",
    end_date: "2026-11-30",
    summary: {
      total_trainers: 2,
      total_sessions_completed: 15,
      total_sales_count: 3,
      total_sales_amount: 12000000,
      total_session_commission: 2250000,
      total_sale_commission: 600000,
      total_commission: 2850000,
    },
    trainers: [
      {
        trainer_id: "tr-1",
        trainer_name: "HLV Tuan Kiet",
        trainer_role: "trainer",
        assigned_clients_count: 5,
        sessions_completed: 10,
        session_commission: 1500000,
        sales_count: 2,
        sales_amount: 8000000,
        sale_commission: 400000,
        total_commission: 1900000,
        payout_status: "pending",
      },
    ],
    sessions: [
      {
        check_in_id: "ci-1",
        membership_id: "mem-1",
        customer_name: "Nguyen Van A",
        package_name: "PT Boxing 10 buoi",
        trainer_id: "tr-1",
        trainer_name: "HLV Tuan Kiet",
        checked_in_at: "2026-11-10T09:00:00Z",
        commission_amount: 150000,
      },
    ],
  }

  beforeEach(() => {
    vi.spyOn(staffsApi, "fetchTrainers").mockResolvedValue(mockTrainers)
    vi.spyOn(commissionsApi, "getTrainerCommissionsReport").mockResolvedValue(mockReport)
  })

  it("renders summary KPIs, trainer table, and allows switching to sessions tab for admin", async () => {
    render(<TrainerCommissionReportSection currentStaff={null} />)

    await waitFor(() => {
      expect(screen.getByText("Báo cáo Hoa hồng PT & Huấn luyện viên")).toBeInTheDocument()
      expect(screen.getByText("HLV Tuan Kiet")).toBeInTheDocument()
      expect(screen.getByText("15")).toBeInTheDocument()
    })

    // Switch to Sessions tab
    const sessionsTab = screen.getByRole("button", { name: /Chi tiết buổi dạy/i })
    fireEvent.click(sessionsTab)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
      expect(screen.getByText("PT Boxing 10 buoi")).toBeInTheDocument()
    })
  })

  it("triggers Excel export when admin clicks Export Excel button", async () => {
    const exportSpy = vi
      .spyOn(commissionsApi, "downloadTrainerCommissionsExcelReport")
      .mockResolvedValue()

    render(<TrainerCommissionReportSection currentStaff={null} />)

    await waitFor(() => {
      expect(screen.getByText("HLV Tuan Kiet")).toBeInTheDocument()
    })

    const exportBtn = screen.getByRole("button", { name: /Xuất Excel/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledTimes(1)
    })
  })

  it("renders trainer-scoped view without export button or trainer filter when logged in as trainer", async () => {
    const trainerStaff: Staff = {
      id: "tr-1",
      name: "HLV Tuan Kiet",
      username: "kiet_pt",
      role: "trainer",
    }

    render(<TrainerCommissionReportSection currentStaff={trainerStaff} />)

    await waitFor(() => {
      expect(screen.getByText("Thu nhập & Ca dạy PT của tôi")).toBeInTheDocument()
      expect(screen.getByText("HLV Tuan Kiet")).toBeInTheDocument()
    })

    expect(screen.queryByRole("button", { name: /Xuất Excel/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Lọc theo huấn luyện viên/i)).not.toBeInTheDocument()
  })
})

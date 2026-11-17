import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskScreen } from "../KioskScreen"
import * as kioskApi from "../../../lib/kiosk"
import * as audioLib from "../../../lib/kioskAudio"

vi.mock("../../../lib/kiosk", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/kiosk")>("../../../lib/kiosk")
  return {
    ...actual,
    fetchKioskConfig: vi.fn(),
    kioskCheckIn: vi.fn(),
    loginKiosk: vi.fn(),
    getStoredKioskToken: vi.fn(),
    setStoredKioskToken: vi.fn(),
    clearStoredKioskToken: vi.fn(),
  }
})

vi.mock("../../../lib/kioskAudio", () => ({
  playSuccessChime: vi.fn(),
  playErrorChime: vi.fn(),
  playMilestoneChime: vi.fn(),
  speakKioskGreeting: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("KioskScreen", () => {
  const mockConfig: kioskApi.KioskConfig = {
    shop: {
      id: "shop-1",
      name: "PunchBook Fitness",
      address: "123 Pho Hue, Ha Noi",
      phone: "0901234567",
    },
    kiosk: {
      enabled: true,
      welcome_message: "Chào mừng quý khách đến với PunchBook!",
      audio_enabled: true,
      camera_enabled: true,
    },
  }

  beforeEach(() => {
    vi.mocked(kioskApi.getStoredKioskToken).mockReturnValue(null)
    vi.mocked(kioskApi.fetchKioskConfig).mockResolvedValue(mockConfig)
  })

  it("renders locked state when no token is available", async () => {
    vi.mocked(kioskApi.getStoredKioskToken).mockReturnValue(null)
    render(<KioskScreen initialToken={null} />)

    expect(screen.getByText(/Thiết bị Kiosk chưa kích hoạt/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Nhập PIN kích hoạt Kiosk/i })).toBeInTheDocument()
  })

  it("loads config and displays shop name and welcome message when token is valid", async () => {
    render(<KioskScreen initialToken="valid-token-123" />)

    await waitFor(() => {
      expect(screen.getByText("PunchBook Fitness")).toBeInTheDocument()
      expect(screen.getByText("Chào mừng quý khách đến với PunchBook!")).toBeInTheDocument()
    })
  })

  it("performs check-in and renders success view when valid phone is entered", async () => {
    vi.mocked(kioskApi.kioskCheckIn).mockResolvedValue({
      status: "success",
      message: "Check-in thành công!",
      audio_text: "Xin chào Tran Van B",
      membership: {
        id: "mem-2",
        customer_name: "Tran Van B",
        phone: "0987654321",
        package_name: "Gói 30 Ngày",
        sessions_left: 8,
        expires_at: "2026-12-15T00:00:00Z",
        status: "active",
        total_check_ins_count: 5,
      },
      check_in: {
        id: "ci-99",
        checked_in_at: "2026-11-17T10:00:00Z",
      },
      milestone_reached: null,
    })

    render(<KioskScreen initialToken="valid-token-123" />)

    await waitFor(() => {
      expect(screen.getByText("PunchBook Fitness")).toBeInTheDocument()
    })

    // Click keypad digits: 0987654321
    const digits = ["0", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
    for (const d of digits) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${d}$`) }))
    }

    await waitFor(() => {
      expect(kioskApi.kioskCheckIn).toHaveBeenCalledWith("0987654321", "valid-token-123")
      expect(screen.getByText(/Tran Van B/i)).toBeInTheDocument()
      expect(screen.getByText("Gói 30 Ngày")).toBeInTheDocument()
      expect(audioLib.playSuccessChime).toHaveBeenCalled()
    })
  })

  it("renders denied view with VietQR when check-in is out of sessions", async () => {
    vi.mocked(kioskApi.kioskCheckIn).mockResolvedValue({
      status: "denied",
      code: "OUT_OF_SESSIONS",
      message: "Gói tập đã hết buổi",
      audio_text: "Gói tập đã hết buổi",
      renewal: {
        invoice_id: "inv-999",
        amount: 300000,
        description: "GIAHAN",
        package_name: "Gói gia hạn 10 buổi",
        vietqr_url: "https://api.vietqr.io/image/970422-0123-compact.png",
        payos_checkout_url: null,
        bank_name: "TPBank",
        bank_account_no: "111222333",
        bank_account_name: "PUNCHBOOK",
      },
    })

    render(<KioskScreen initialToken="valid-token-123" />)

    await waitFor(() => {
      expect(screen.getByText("PunchBook Fitness")).toBeInTheDocument()
    })

    const digits = ["0", "9", "1", "1", "2", "2", "3", "3", "4", "4"]
    for (const d of digits) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${d}$`) }))
    }

    await waitFor(() => {
      expect(screen.getByText("Gói tập đã hết buổi")).toBeInTheDocument()
      expect(screen.getByText("Gói gia hạn 10 buổi")).toBeInTheDocument()
      expect(audioLib.playErrorChime).toHaveBeenCalled()
    })
  })

  it("opens PIN modal when exit button is clicked", async () => {
    render(<KioskScreen initialToken="valid-token-123" />)

    await waitFor(() => {
      expect(screen.getByText("PunchBook Fitness")).toBeInTheDocument()
    })

    const exitBtn = screen.getByTitle(/Thoát chế độ Kiosk/i)
    fireEvent.click(exitBtn)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/Thoát chế độ Kiosk|kiosk\.pin_modal_title_exit/i)).toBeInTheDocument()
  })
})

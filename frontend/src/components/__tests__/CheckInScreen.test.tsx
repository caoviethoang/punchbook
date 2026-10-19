import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { CheckInScreen } from "../CheckInScreen"
import * as checkInHook from "../../hooks/useCheckInScreen"
import type { Membership } from "../../lib/memberships"
import type { Staff } from "../../lib/auth"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("CheckInScreen component", () => {
  const dummyMember1: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 10,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
    },
    checked_in_today: false,
    last_checked_in_at: null,
  }

  const dummyMember2: Membership = {
    id: "m-2",
    customer_name: "Tran Thi B",
    phone: "0912345678",
    sessions_left: null,
    expires_at: "2026-11-01",
    package: {
      id: "pkg-2",
      name: "Gói Tháng Gym",
      duration_days: 30,
    },
    checked_in_today: false,
    last_checked_in_at: null,
  }

  const dummyStaff: Staff = {
    id: "staff-1",
    name: "Lễ tân A",
    role: "staff",
    username: "letana",
  }

  const defaultHookState = {
    query: "",
    setQuery: vi.fn(),
    memberships: [] as Membership[],
    checkingInId: null as string | null,
    checkInMessage: null as { id: string; type: "success" | "error"; text: string } | null,
    toast: null as { message: string; type?: "success" | "error" } | null,
    setToast: vi.fn(),
    isQRScannerOpen: false,
    setIsQRScannerOpen: vi.fn(),
    selectedReceipt: null,
    setSelectedReceipt: vi.fn(),
    inputRef: { current: null },
    detailMembershipId: null as string | null,
    setDetailMembershipId: vi.fn(),
    renewingMembership: null as Membership | null,
    setRenewingMembership: vi.fn(),
    isLoading: false,
    apiError: null as string | null,
    handleClear: vi.fn(),
    handleKeyDown: vi.fn(),
    handleCheckIn: vi.fn(),
    handleQRScan: vi.fn(),
    handlePrintReceipt: vi.fn(),
    staffs: [dummyStaff],
    loadingStaffs: false,
    selectedStaffId: null as string | null,
    setSelectedStaffId: vi.fn(),
  }

  beforeEach(() => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
    })
  })

  it("renders empty prompt when query is blank", () => {
    render(<CheckInScreen />)

    expect(screen.getByText(/nhập tên hoặc sđt để bắt đầu/i)).toBeInTheDocument()
    expect(
      screen.getByText(/hệ thống sẽ hiển thị danh sách gói tập tương ứng để bạn thực hiện điểm danh/i),
    ).toBeInTheDocument()
  })

  it("renders 'không tìm thấy hội viên' when query has no matching results", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Không tồn tại",
      memberships: [],
      isLoading: false,
    })

    render(<CheckInScreen />)

    expect(screen.getByText(/không tìm thấy hội viên phù hợp/i)).toBeInTheDocument()
    expect(screen.getByText("Không tồn tại")).toBeInTheDocument()
  })

  it("renders memberships list when memberships exist", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [dummyMember1, dummyMember2],
    })

    render(<CheckInScreen />)

    // Verify member 1 details
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText("Gói 10 buổi")).toBeInTheDocument()
    expect(screen.getByText("0901234567")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("buổi còn lại")).toBeInTheDocument()

    // Verify member 2 details
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
    expect(screen.getByText("Gói Tháng Gym")).toBeInTheDocument()
    expect(screen.getByText("0912345678")).toBeInTheDocument()
  })

  it("displays success message after check-in", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [dummyMember1],
      checkInMessage: {
        id: "m-1",
        type: "success",
        text: "Check-in thành công! (Còn lại 9 buổi)",
      },
    })

    render(<CheckInScreen />)

    expect(screen.getByText("Check-in thành công! (Còn lại 9 buổi)")).toBeInTheDocument()
    expect(screen.getByText(/in phiếu ngay/i)).toBeInTheDocument()
  })

  it("displays error message when check-in fails", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [dummyMember1],
      checkInMessage: {
        id: "m-1",
        type: "error",
        text: "Hội viên đã hết số buổi tập.",
      },
    })

    render(<CheckInScreen />)

    expect(screen.getByText("Hội viên đã hết số buổi tập.")).toBeInTheDocument()
  })

  it("disables check-in button when membership is already checked in today", () => {
    const checkedInMember: Membership = {
      ...dummyMember1,
      checked_in_today: true,
      last_checked_in_at: "2026-10-16T08:30:00Z",
    }

    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [checkedInMember],
    })

    render(<CheckInScreen />)

    const checkInBtn = screen.getByRole("button", {
      name: /nguyen van a đã check-in hôm nay/i,
    })
    expect(checkInBtn).toBeDisabled()
    expect(screen.getByText("Đã Check-in")).toBeInTheDocument()
  })

  it("disables check-in button when membership is exhausted (0 sessions left)", () => {
    const exhaustedMember: Membership = {
      ...dummyMember1,
      sessions_left: 0,
    }

    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [exhaustedMember],
    })

    render(<CheckInScreen />)

    const checkInBtn = screen.getByRole("button", {
      name: /nguyen van a đã hết — không thể check-in/i,
    })
    expect(checkInBtn).toBeDisabled()
    expect(screen.getByText("Đã hết")).toBeInTheDocument()
  })

  it("clicking Check-in button calls handleCheckIn", () => {
    const handleCheckInMock = vi.fn()

    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      query: "Nguyen",
      memberships: [dummyMember1],
      handleCheckIn: handleCheckInMock,
    })

    render(<CheckInScreen />)

    const checkInBtn = screen.getByRole("button", {
      name: /^check-in cho nguyen van a$/i,
    })
    fireEvent.click(checkInBtn)

    expect(handleCheckInMock).toHaveBeenCalledWith("m-1")
  })

  it("renders api error alert banner when apiError is provided", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      apiError: "Lỗi kết nối máy chủ",
    })

    render(<CheckInScreen />)

    const alertBanner = screen.getByRole("alert")
    expect(alertBanner).toBeInTheDocument()
    expect(screen.getByText("Lỗi kết nối máy chủ")).toBeInTheDocument()
  })

  it("renders toast when toast state is set", () => {
    vi.spyOn(checkInHook, "useCheckInScreen").mockReturnValue({
      ...defaultHookState,
      toast: {
        message: "Đã check-in thành công cho Nguyen Van A",
        type: "success",
      },
    })

    render(<CheckInScreen />)

    expect(screen.getByText("Đã check-in thành công cho Nguyen Van A")).toBeInTheDocument()
  })
})

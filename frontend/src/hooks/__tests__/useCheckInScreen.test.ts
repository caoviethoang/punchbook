import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useCheckInScreen } from "../useCheckInScreen"
import * as membershipsApi from "../../lib/memberships"
import * as staffsApi from "../../lib/staffs"
import type { Membership, CheckInResult } from "../../lib/memberships"
import type { Staff } from "../../lib/auth"

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe("useCheckInScreen hook", () => {
  const dummyMember: Membership = {
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

  const dummyStaffs: Staff[] = [
    { id: "staff-1", name: "Lễ tân A", role: "staff", username: "letana" },
    { id: "staff-2", name: "Lễ tân B", role: "staff", username: "letanb" },
  ]

  beforeEach(() => {
    vi.spyOn(staffsApi, "fetchStaffs").mockResolvedValue(dummyStaffs)
    vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([dummyMember])
  })

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useCheckInScreen({
        shopName: "PunchBook Spa",
      }),
    )

    expect(result.current.query).toBe("")
    expect(result.current.checkingInId).toBeNull()
    expect(result.current.checkInMessage).toBeNull()
    expect(result.current.toast).toBeNull()
    expect(result.current.isQRScannerOpen).toBe(false)
    expect(result.current.selectedReceipt).toBeNull()
  })

  it("fetches staff list on mount for admin users", async () => {
    const adminStaff: Staff = { id: "admin-1", name: "Admin", role: "admin", username: "admin" }
    const { result } = renderHook(() =>
      useCheckInScreen({
        currentStaff: adminStaff,
      }),
    )

    await waitFor(() => {
      expect(result.current.staffs).toEqual(dummyStaffs)
      expect(result.current.loadingStaffs).toBe(false)
    })
    expect(staffsApi.fetchStaffs).toHaveBeenCalledTimes(1)
  })

  it("does not fetch staff list for regular staff users", async () => {
    const regularStaff: Staff = { id: "staff-1", name: "Staff", role: "staff", username: "staff" }
    const { result } = renderHook(() =>
      useCheckInScreen({
        currentStaff: regularStaff,
      }),
    )

    expect(staffsApi.fetchStaffs).not.toHaveBeenCalled()
    expect(result.current.loadingStaffs).toBe(false)
  })

  it("searches memberships when query changes (debounced)", async () => {
    const searchSpy = vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([dummyMember])

    const { result } = renderHook(() => useCheckInScreen({}))

    act(() => {
      result.current.setQuery("Nguyen")
    })

    expect(result.current.query).toBe("Nguyen")

    await waitFor(
      () => {
        expect(searchSpy).toHaveBeenCalledWith("Nguyen")
        expect(result.current.memberships).toEqual([dummyMember])
      },
      { timeout: 1000 },
    )
  })

  it("handleCheckIn: performs optimistic update and commits on success", async () => {
    let resolveCheckIn!: (value: CheckInResult) => void
    const checkInPromise = new Promise<CheckInResult>((resolve) => {
      resolveCheckIn = resolve
    })

    vi.spyOn(membershipsApi, "checkIn").mockImplementation(() => checkInPromise)

    const { result } = renderHook(() => useCheckInScreen({}))

    // Wait for initial search to populate memberships
    await waitFor(() => {
      expect(result.current.memberships).toEqual([dummyMember])
    })

    // Trigger check-in
    let checkInActionPromise: Promise<void>
    act(() => {
      checkInActionPromise = result.current.handleCheckIn("m-1")
    })

    // 1. Optimistic update should be visible immediately while request is in-flight
    expect(result.current.checkingInId).toBe("m-1")
    expect(result.current.memberships[0].sessions_left).toBe(9)

    // 2. Resolve backend checkIn response
    const mockSuccessResult: CheckInResult = {
      membership: {
        ...dummyMember,
        sessions_left: 9,
        checked_in_today: true,
      },
      check_in: {
        id: "ci-101",
        checked_in_at: "2026-10-16T10:30:00Z",
      },
    }

    await act(async () => {
      resolveCheckIn(mockSuccessResult)
      await checkInActionPromise
    })

    // 3. State committed after success
    expect(result.current.checkingInId).toBeNull()
    expect(result.current.memberships[0].sessions_left).toBe(9)
    expect(result.current.memberships[0].checked_in_today).toBe(true)
    expect(result.current.memberships[0].last_checked_in_at).toBe("2026-10-16T10:30:00Z")
    expect(result.current.checkInMessage).toEqual({
      id: "m-1",
      type: "success",
      text: "Check-in thành công! (Còn lại 9 buổi)",
    })
    expect(result.current.toast).toEqual({
      message: "Đã check-in thành công cho Nguyen Van A",
      type: "success",
    })
  })

  it("handleCheckIn: rolls back optimistic update when checkIn fails", async () => {
    let rejectCheckIn!: (reason?: unknown) => void
    const checkInPromise = new Promise<CheckInResult>((_, reject) => {
      rejectCheckIn = reject
    })

    vi.spyOn(membershipsApi, "checkIn").mockImplementation(() => checkInPromise)

    const { result } = renderHook(() => useCheckInScreen({}))

    // Wait for initial search to populate memberships
    await waitFor(() => {
      expect(result.current.memberships).toEqual([dummyMember])
    })

    // Trigger check-in
    let checkInActionPromise: Promise<void>
    act(() => {
      checkInActionPromise = result.current.handleCheckIn("m-1")
    })

    // Optimistically decremented to 9
    expect(result.current.checkingInId).toBe("m-1")
    expect(result.current.memberships[0].sessions_left).toBe(9)

    // Reject the check-in request with API error
    await act(async () => {
      rejectCheckIn(new Error("Hội viên đã hết số buổi tập."))
      await checkInActionPromise
    })

    // Rollback: sessions_left must be restored to 10
    expect(result.current.checkingInId).toBeNull()
    expect(result.current.memberships[0].sessions_left).toBe(10)
    expect(result.current.checkInMessage).toEqual({
      id: "m-1",
      type: "error",
      text: "Hội viên đã hết số buổi tập.",
    })
  })

  it("handleCheckIn: sends correct effective staff_id", async () => {
    const checkInSpy = vi.spyOn(membershipsApi, "checkIn").mockResolvedValue({
      membership: { ...dummyMember, sessions_left: 9 },
      check_in: { id: "ci-1", checked_in_at: "2026-10-16T10:00:00Z" },
    })

    // 1. When selectedStaffId is explicitly chosen
    const { result } = renderHook(() =>
      useCheckInScreen({
        currentStaff: { id: "admin-1", name: "Admin", role: "admin", username: "admin" },
      }),
    )

    await waitFor(() => {
      expect(result.current.memberships.length).toBeGreaterThan(0)
    })

    act(() => {
      result.current.setSelectedStaffId("staff-2")
    })

    await act(async () => {
      await result.current.handleCheckIn("m-1")
    })

    expect(checkInSpy).toHaveBeenCalledWith("m-1", "staff-2")
  })

  it("handleCheckIn: falls back to currentStaff.id when selectedStaffId is null", async () => {
    const checkInSpy = vi.spyOn(membershipsApi, "checkIn").mockResolvedValue({
      membership: { ...dummyMember, sessions_left: 9 },
      check_in: { id: "ci-1", checked_in_at: "2026-10-16T10:00:00Z" },
    })

    const { result } = renderHook(() =>
      useCheckInScreen({
        currentStaff: { id: "staff-fallback", name: "Staff", role: "staff", username: "staff" },
      }),
    )

    await waitFor(() => {
      expect(result.current.memberships.length).toBeGreaterThan(0)
    })

    await act(async () => {
      await result.current.handleCheckIn("m-1")
    })

    expect(checkInSpy).toHaveBeenCalledWith("m-1", "staff-fallback")
  })

  it("handleCheckIn: early returns if membership is exhausted or not found", async () => {
    const exhaustedMember: Membership = {
      ...dummyMember,
      id: "m-exhausted",
      sessions_left: 0,
    }
    vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([exhaustedMember])
    const checkInSpy = vi.spyOn(membershipsApi, "checkIn")

    const { result } = renderHook(() => useCheckInScreen({}))

    await waitFor(() => {
      expect(result.current.memberships).toEqual([exhaustedMember])
    })

    // Exhausted membership
    await act(async () => {
      await result.current.handleCheckIn("m-exhausted")
    })
    expect(checkInSpy).not.toHaveBeenCalled()

    // Non-existent ID
    await act(async () => {
      await result.current.handleCheckIn("non-existent-id")
    })
    expect(checkInSpy).not.toHaveBeenCalled()
  })

  it("handleClear resets query", () => {
    const { result } = renderHook(() => useCheckInScreen({}))

    act(() => {
      result.current.setQuery("test query")
    })
    expect(result.current.query).toBe("test query")

    act(() => {
      result.current.handleClear()
    })
    expect(result.current.query).toBe("")
  })

  it("handlePrintReceipt prepares receipt data", () => {
    const { result } = renderHook(() =>
      useCheckInScreen({
        shopName: "Spa Test",
        shopAddress: "123 Pho Hue",
        shopPhone: "0900000000",
        currentStaff: { id: "staff-1", name: "Lan Receptionist", role: "staff", username: "lan" },
      }),
    )

    act(() => {
      result.current.handlePrintReceipt(dummyMember, "2026-10-16T10:00:00Z")
    })

    expect(result.current.selectedReceipt).toEqual({
      shopName: "Spa Test",
      shopAddress: "123 Pho Hue",
      shopPhone: "0900000000",
      customerName: "Nguyen Van A",
      customerPhone: "0901234567",
      packageName: "Gói 10 buổi",
      sessionsLeft: 10,
      expiresAt: null,
      checkedInAt: "2026-10-16T10:00:00Z",
      staffName: "Lan Receptionist",
    })
  })

  it("refreshMemberships: explicitly re-fetches memberships with current query", async () => {
    const searchSpy = vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([dummyMember])
    const { result } = renderHook(() => useCheckInScreen({}))

    await waitFor(() => {
      expect(result.current.memberships).toEqual([dummyMember])
    })

    const updatedMember = { ...dummyMember, sessions_left: 9 }
    searchSpy.mockResolvedValue([updatedMember])

    await act(async () => {
      await result.current.refreshMemberships()
    })

    expect(result.current.memberships).toEqual([updatedMember])
    expect(searchSpy).toHaveBeenCalledWith("")
  })
})

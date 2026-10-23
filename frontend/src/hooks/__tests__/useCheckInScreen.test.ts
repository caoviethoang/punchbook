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

  const dummyMeta = { total: 1, page: 1, per_page: 20, total_pages: 1 }

  beforeEach(() => {
    vi.spyOn(staffsApi, "fetchStaffs").mockResolvedValue(dummyStaffs)
    vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMember],
      meta: dummyMeta,
    })
    vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([dummyMember])
  })

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useCheckInScreen({
        shopName: "PunchBook Spa",
      }),
    )

    expect(result.current.query).toBe("")
    expect(result.current.filter).toBe("not_checked_in")
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
    const fetchSpy = vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMember],
      meta: dummyMeta,
    })

    const { result } = renderHook(() => useCheckInScreen({}))

    act(() => {
      result.current.setQuery("Nguyen")
    })

    expect(result.current.query).toBe("Nguyen")

    await waitFor(
      () => {
        expect(fetchSpy).toHaveBeenCalledWith({
          query: "Nguyen",
          page: 1,
          per_page: 20,
          sort: "checkin_priority",
          status: "not_checked_in",
        })
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
    vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [exhaustedMember],
      meta: dummyMeta,
    })
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
    const fetchSpy = vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMember],
      meta: dummyMeta,
    })
    const { result } = renderHook(() => useCheckInScreen({}))

    await waitFor(() => {
      expect(result.current.memberships).toEqual([dummyMember])
    })

    const updatedMember = { ...dummyMember, sessions_left: 9 }
    fetchSpy.mockResolvedValue({
      memberships: [updatedMember],
      meta: dummyMeta,
    })

    await act(async () => {
      await result.current.refreshMemberships()
    })

    expect(result.current.memberships).toEqual([updatedMember])
    expect(fetchSpy).toHaveBeenCalledWith({
      query: "",
      page: 1,
      per_page: 20,
      sort: "checkin_priority",
      status: "not_checked_in",
    })
  })

  it("supports pagination: updates page and fetches page data", async () => {
    const fetchSpy = vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMember],
      meta: { total: 40, page: 2, per_page: 20, total_pages: 2 },
    })

    const { result } = renderHook(() => useCheckInScreen({}))

    act(() => {
      result.current.setPage(2)
    })

    await waitFor(() => {
      expect(result.current.page).toBe(2)
      expect(fetchSpy).toHaveBeenCalledWith({
        query: "",
        page: 2,
        per_page: 20,
        sort: "checkin_priority",
        status: "not_checked_in",
      })
    })
  })

  it("supports status filter: updates filter, resets page, and fetches filtered data", async () => {
    const fetchSpy = vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMember],
      meta: dummyMeta,
    })

    const { result } = renderHook(() => useCheckInScreen({}))

    act(() => {
      result.current.setPage(2)
      result.current.setFilter("expiring")
    })

    expect(result.current.filter).toBe("expiring")
    expect(result.current.page).toBe(1)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith({
        query: "",
        page: 1,
        per_page: 20,
        sort: "checkin_priority",
        status: "expiring",
      })
    })
  })

  describe("handleQRScan", () => {
    it("immediately checks in when member is already present in list", async () => {
      const checkInSpy = vi.spyOn(membershipsApi, "checkIn").mockResolvedValue({
        membership: { ...dummyMember, sessions_left: 9 },
        check_in: { id: "ci-qr-1", checked_in_at: "2026-10-16T10:05:00Z" },
      })

      const { result } = renderHook(() => useCheckInScreen({}))

      // Preload members via query
      act(() => {
        result.current.setQuery("Nguyen")
      })
      await waitFor(() => {
        expect(result.current.memberships).toHaveLength(1)
      })

      await act(async () => {
        await result.current.handleQRScan(`PUNCHBOOK:${dummyMember.id}`)
      })

      expect(checkInSpy).toHaveBeenCalledWith(dummyMember.id, undefined)
      expect(result.current.isQRScannerOpen).toBe(false)
      expect(result.current.toast).toEqual({
        message: "Đã check-in thành công cho Nguyen Van A",
        type: "success",
      })
    })

    it("searches and checks in member when not preloaded in list", async () => {
      const newMember: Membership = {
        id: "m-new",
        customer_name: "Tran Van B",
        phone: "0987654321",
        sessions_left: 5,
        expires_at: null,
        package: { id: "pkg-2", name: "Gói 5 buổi" },
      }

      vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([newMember])
      const checkInSpy = vi.spyOn(membershipsApi, "checkIn").mockResolvedValue({
        membership: { ...newMember, sessions_left: 4 },
        check_in: { id: "ci-qr-2", checked_in_at: "2026-10-16T10:10:00Z" },
      })

      const { result } = renderHook(() => useCheckInScreen({}))

      await act(async () => {
        await result.current.handleQRScan(`PUNCHBOOK:${newMember.id}`)
      })

      expect(checkInSpy).toHaveBeenCalledWith(newMember.id, undefined)
      expect(result.current.toast).toEqual({
        message: "Đã check-in thành công cho Tran Van B",
        type: "success",
      })
    })

    it("shows error toast when scanned QR does not match any member", async () => {
      vi.spyOn(membershipsApi, "searchMemberships").mockResolvedValue([])
      vi.spyOn(membershipsApi, "getMembershipDetail").mockRejectedValue(new Error("Not found"))

      const { result } = renderHook(() => useCheckInScreen({}))

      await act(async () => {
        await result.current.handleQRScan("PUNCHBOOK:unknown-id")
      })

      expect(result.current.toast).toEqual({
        message: "Không tìm thấy hội viên từ mã QR này",
        type: "error",
      })
    })
  })

  describe("Group batch check-in", () => {
    it("toggles group mode and clears selection on disable", () => {
      const { result } = renderHook(() => useCheckInScreen({}))
      expect(result.current.isGroupMode).toBe(false)

      act(() => {
        result.current.toggleGroupMode()
      })
      expect(result.current.isGroupMode).toBe(true)

      act(() => {
        result.current.toggleSelectMember("m-1")
      })
      expect(result.current.selectedIds.has("m-1")).toBe(true)

      act(() => {
        result.current.toggleGroupMode()
      })
      expect(result.current.isGroupMode).toBe(false)
      expect(result.current.selectedIds.size).toBe(0)
    })

    it("toggles member selection and selects all eligible members", async () => {
      const exhaustedMember: Membership = {
        ...dummyMember,
        id: "m-2",
        sessions_left: 0,
      }
      const checkedInMember: Membership = {
        ...dummyMember,
        id: "m-3",
        checked_in_today: true,
      }
      vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
        memberships: [dummyMember, exhaustedMember, checkedInMember],
        meta: dummyMeta,
      })

      const { result } = renderHook(() => useCheckInScreen({}))
      await waitFor(() => expect(result.current.memberships.length).toBe(3))

      act(() => {
        result.current.toggleSelectMember("m-1")
      })
      expect(result.current.selectedIds.has("m-1")).toBe(true)

      act(() => {
        result.current.toggleSelectMember("m-1")
      })
      expect(result.current.selectedIds.has("m-1")).toBe(false)

      act(() => {
        result.current.selectAllEligible()
      })
      expect(result.current.selectedIds.has("m-1")).toBe(true)
      expect(result.current.selectedIds.has("m-2")).toBe(false)
      expect(result.current.selectedIds.has("m-3")).toBe(false)

      act(() => {
        result.current.clearSelection()
      })
      expect(result.current.selectedIds.size).toBe(0)
    })

    it("handles batchCheckIn: calls API, updates local state, sets modal result and toast", async () => {
      const batchResult: membershipsApi.BatchCheckInResult = {
        total: 1,
        success_count: 1,
        failed_count: 0,
        results: [
          {
            membership_id: "m-1",
            customer_name: "Nguyen Van A",
            status: "success",
            membership: { ...dummyMember, sessions_left: 9 },
            check_in: { id: "ci-batch-1", checked_in_at: "2026-10-22T08:00:00Z" },
          },
        ],
      }
      const batchSpy = vi.spyOn(membershipsApi, "batchCheckIn").mockResolvedValue(batchResult)

      const { result } = renderHook(() => useCheckInScreen({}))
      await waitFor(() => expect(result.current.memberships.length).toBe(1))

      act(() => {
        result.current.toggleSelectMember("m-1")
      })

      await act(async () => {
        await result.current.handleBatchCheckIn()
      })

      expect(batchSpy).toHaveBeenCalledWith(["m-1"], undefined)
      expect(result.current.batchResult).toEqual(batchResult)
      expect(result.current.isBatchResultModalOpen).toBe(true)
      expect(result.current.selectedIds.size).toBe(0)
      expect(result.current.memberships[0].sessions_left).toBe(9)
      expect(result.current.memberships[0].checked_in_today).toBe(true)
      expect(result.current.toast).toEqual({
        message: "Điểm danh nhóm: 1/1 thành công",
        type: "success",
      })
    })
  })
})

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"
import { useDebounce } from "./useDebounce"
import { useMembershipsApi } from "./useMembershipsApi"
import type { Staff } from "../lib/auth"
import { toApiError, toCheckInError } from "../lib/errors"
import {
  extractMembershipIdFromQR,
  fetchMemberships,
  getMembershipDetail,
  isMembershipExhausted,
  type CheckInFilterType,
  type Membership,
  type PaginationMeta,
  type RenewMembershipResult,
} from "../lib/memberships"
import { fetchStaffs } from "../lib/staffs"
import type { ReceiptData } from "../components/ThermalReceiptModal"

interface UseCheckInScreenProps {
  currentStaff?: Staff | null
  currentStaffId?: string
  shopName?: string
  shopAddress?: string | null
  shopPhone?: string | null
}

export function useCheckInScreen({
  currentStaff,
  currentStaffId,
  shopName = "PunchBook Spa",
  shopAddress,
  shopPhone,
}: UseCheckInScreenProps) {
  const [query, setQueryState] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  const [memberships, setMemberships] = useState<Membership[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [loadingStaffs, setLoadingStaffs] = useState(
    () => !currentStaff || currentStaff.role === "admin",
  )
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    () => currentStaff?.id || currentStaffId || null,
  )
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [checkInMessage, setCheckInMessage] = useState<{
    id: string
    type: "success" | "error"
    text: string
  } | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type?: "success" | "error"
  } | null>(null)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const { search, checkIn, searchLoading, error: apiError } = useMembershipsApi()

  const [filter, setFilterState] = useState<CheckInFilterType>("not_checked_in")
  const [page, setPage] = useState(1)
  const setQuery = useCallback((nextQuery: string | ((prev: string) => string)) => {
    setQueryState(nextQuery)
    setPage(1)
  }, [])
  const setFilter = useCallback((nextFilter: CheckInFilterType) => {
    setFilterState(nextFilter)
    setPage(1)
  }, [])
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Modal state for detail & renewal
  const [detailMembershipId, setDetailMembershipId] = useState<string | null>(null)
  const [renewingMembership, setRenewingMembership] = useState<Membership | null>(null)
  const [autoCheckInOnRenew, setAutoCheckInOnRenew] = useState<boolean>(true)

  const isDebouncing = query !== debouncedQuery
  const isLoading = fetchLoading || searchLoading || isDebouncing
  const combinedError = fetchError || apiError

  // Fetch staff list if user is admin
  useEffect(() => {
    const isAdmin = !currentStaff || currentStaff.role === "admin"
    if (!isAdmin) return

    let isCancelled = false
    fetchStaffs()
      .then((list) => {
        if (!isCancelled) {
          setStaffs(list)
        }
      })
      .catch(() => {
        // Ignore gracefully if cannot load staffs
      })
      .finally(() => {
        if (!isCancelled) setLoadingStaffs(false)
      })

    return () => {
      isCancelled = true
    }
  }, [currentStaff])

  const handlePrintReceipt = useCallback(
    (membership: Membership, checkedInAt?: string) => {
      const effectiveStaffId = selectedStaffId || currentStaff?.id || currentStaffId || undefined
      const activeStaff = staffs.find((s) => s.id === effectiveStaffId) || currentStaff
      const staffName =
        activeStaff?.name || (currentStaff?.name ?? (effectiveStaffId ? undefined : "Admin"))

      setSelectedReceipt({
        shopName,
        shopAddress,
        shopPhone,
        customerName: membership.customer_name,
        customerPhone: membership.phone,
        packageName: membership.package.name,
        sessionsLeft: membership.sessions_left,
        expiresAt: membership.expires_at,
        checkedInAt: checkedInAt || new Date().toISOString(),
        staffName,
      })
    },
    [selectedStaffId, currentStaff, currentStaffId, staffs, shopName, shopAddress, shopPhone],
  )

  const openRenewModal = useCallback((membership: Membership, autoCheckIn = true) => {
    setRenewingMembership(membership)
    setAutoCheckInOnRenew(autoCheckIn)
  }, [])

  const handleRenewSuccess = useCallback((result: RenewMembershipResult) => {
    setMemberships((prev) =>
      prev.map((m) => {
        if (m.id !== result.membership.id) return m
        return {
          ...result.membership,
          checked_in_today: result.check_in ? true : m.checked_in_today,
          last_checked_in_at: result.check_in?.checked_in_at ?? m.last_checked_in_at,
        }
      }),
    )

    if (result.check_in) {
      setToast({
        message: `Đã gia hạn và check-in thành công cho ${result.membership.customer_name}`,
        type: "success",
      })
      handlePrintReceipt(result.membership, result.check_in.checked_in_at)
    } else {
      setToast({
        message: `Đã gia hạn thành công cho ${result.membership.customer_name}`,
        type: "success",
      })
    }

    setRenewingMembership(null)
    setAutoCheckInOnRenew(false)
  }, [handlePrintReceipt])

  // Fetch memberships using debounced query, filter status, sort and pagination
  const refreshMemberships = useCallback(async () => {
    try {
      const res = await fetchMemberships({
        query: debouncedQuery,
        status: filter,
        sort: "checkin_priority",
        page,
        per_page: 20,
      })
      setMemberships(res.memberships)
      if (res.meta) setPaginationMeta(res.meta)
    } catch {
      // Error handling managed by hook
    }
  }, [debouncedQuery, filter, page])

  useEffect(() => {
    let isCancelled = false

    const loadMemberships = async () => {
      setFetchLoading(true)
      setFetchError(null)

      try {
        const res = await fetchMemberships({
          query: debouncedQuery,
          status: filter,
          sort: "checkin_priority",
          page,
          per_page: 20,
        })
        if (!isCancelled) {
          setMemberships(res.memberships)
          if (res.meta) setPaginationMeta(res.meta)
        }
      } catch (err) {
        if (!isCancelled) {
          setFetchError(toApiError(err, "Không thể tải danh sách hội viên."))
        }
      } finally {
        if (!isCancelled) {
          setFetchLoading(false)
        }
      }
    }

    void loadMemberships()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, filter, page])

  function handleClear() {
    setQuery("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  async function handleCheckIn(membershipId: string, targetMembership?: Membership) {
    const membership = targetMembership || memberships.find((m) => m.id === membershipId)
    if (!membership) return

    if (isMembershipExhausted(membership)) {
      openRenewModal(membership, true)
      return
    }

    const previousSessionsLeft = membership.sessions_left

    setCheckingInId(membershipId)
    setCheckInMessage(null)

    // Optimistic update
    setMemberships((prev) => {
      const exists = prev.some((m) => m.id === membershipId)
      if (exists) {
        return prev.map((m) =>
          m.id === membershipId && m.sessions_left !== null
            ? { ...m, sessions_left: m.sessions_left - 1 }
            : m,
        )
      }
      return [
        {
          ...membership,
          sessions_left:
            membership.sessions_left !== null ? membership.sessions_left - 1 : null,
        },
        ...prev,
      ]
    })

    try {
      const effectiveStaffId = selectedStaffId || currentStaff?.id || currentStaffId || undefined
      const result = await checkIn(membershipId, effectiveStaffId)
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === membershipId
            ? {
                ...m,
                sessions_left: result.membership.sessions_left,
                checked_in_today: true,
                last_checked_in_at: result.check_in.checked_in_at,
              }
            : m,
        ),
      )
      setCheckInMessage({
        id: membershipId,
        type: "success",
        text: `Check-in thành công! (Còn lại ${result.membership.sessions_left ?? "không giới hạn"} buổi)`,
      })
      setToast({
        message: `Đã check-in thành công cho ${membership.customer_name}`,
        type: "success",
      })
    } catch (err) {
      // Rollback
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === membershipId ? { ...m, sessions_left: previousSessionsLeft } : m,
        ),
      )
      setCheckInMessage({
        id: membershipId,
        type: "error",
        text: toCheckInError(err),
      })
    } finally {
      setCheckingInId(null)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const firstAvailable = memberships.find((m) => !m.checked_in_today)
      if (firstAvailable && checkingInId !== firstAvailable.id) {
        void handleCheckIn(firstAvailable.id)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleClear()
    }
  }

  async function handleQRScan(scannedText: string) {
    setIsQRScannerOpen(false)
    const targetId = extractMembershipIdFromQR(scannedText)

    const existing = memberships.find((m) => m.id === targetId || m.phone === targetId)
    if (existing) {
      void handleCheckIn(existing.id, existing)
      return
    }

    try {
      const results = await search(targetId)
      if (results.length > 0) {
        const matched = results.find((m) => m.id === targetId || m.phone === targetId) ?? results[0]
        setMemberships(results)
        void handleCheckIn(matched.id, matched)
        return
      }

      // Fallback: direct getMembershipDetail lookup if targetId is an ID
      try {
        const detail = await getMembershipDetail(targetId)
        if (detail) {
          setMemberships((prev) => [detail, ...prev.filter((m) => m.id !== detail.id)])
          void handleCheckIn(detail.id, detail)
          return
        }
      } catch {
        // Fallback failed
      }

      setToast({
        message: "Không tìm thấy hội viên từ mã QR này",
        type: "error",
      })
    } catch {
      setToast({
        message: "Không thể kiểm tra mã QR",
        type: "error",
      })
    }
  }

  return {
    query,
    setQuery,
    filter,
    setFilter,
    memberships,
    checkingInId,
    checkInMessage,
    toast,
    setToast,
    isQRScannerOpen,
    setIsQRScannerOpen,
    selectedReceipt,
    setSelectedReceipt,
    inputRef,
    detailMembershipId,
    setDetailMembershipId,
    renewingMembership,
    setRenewingMembership,
    autoCheckInOnRenew,
    setAutoCheckInOnRenew,
    openRenewModal,
    handleRenewSuccess,
    page,
    setPage,
    paginationMeta,
    isLoading,
    apiError: combinedError,
    handleClear,
    handleKeyDown,
    handleCheckIn,
    handleQRScan,
    handlePrintReceipt,
    staffs,
    loadingStaffs,
    selectedStaffId,
    setSelectedStaffId,
    refreshMemberships,
  }
}

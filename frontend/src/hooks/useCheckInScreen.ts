import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { useDebounce } from "./useDebounce"
import { useMembershipsApi } from "./useMembershipsApi"
import type { Staff } from "../lib/auth"
import { toCheckInError } from "../lib/errors"
import {
  extractMembershipIdFromQR,
  getMembershipDetail,
  isMembershipExhausted,
  type Membership,
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
  const [query, setQuery] = useState("")
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

  // Modal state for detail & renewal
  const [detailMembershipId, setDetailMembershipId] = useState<string | null>(null)
  const [renewingMembership, setRenewingMembership] = useState<Membership | null>(null)

  const isDebouncing = query !== debouncedQuery
  const isLoading = searchLoading || isDebouncing

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

  function handlePrintReceipt(membership: Membership, checkedInAt?: string) {
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
  }

  // Fetch memberships using debounced query
  useEffect(() => {
    let isCancelled = false

    search(debouncedQuery)
      .then((results) => {
        if (!isCancelled) {
          setMemberships(results)
        }
      })
      .catch(() => {
        // Error handling managed by useMembershipsApi hook
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, search])

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
      setToast({
        message: "Hội viên đã hết buổi hoặc hết hạn thẻ",
        type: "error",
      })
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
      const firstAvailable = memberships.find(
        (m) => !isMembershipExhausted(m) && !m.checked_in_today,
      )
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
    isLoading,
    apiError,
    handleClear,
    handleKeyDown,
    handleCheckIn,
    handleQRScan,
    handlePrintReceipt,
    staffs,
    loadingStaffs,
    selectedStaffId,
    setSelectedStaffId,
  }
}

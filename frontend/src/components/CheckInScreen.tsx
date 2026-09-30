import React, { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Loader2,
  QrCode,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react"
import { useDebounce } from "../hooks/useDebounce"
import { useMembershipsApi } from "../hooks/useMembershipsApi"
import { toCheckInError } from "../lib/errors"
import {
  extractMembershipIdFromQR,
  isMembershipExhausted,
  type Membership,
} from "../lib/memberships"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { RenewalModal } from "./RenewalModal"
import { QRScannerModal } from "./QRScannerModal"
import { Toast } from "./ui/Toast"
import { MembershipResultList } from "./checkin/CheckInSearchResults"

interface CheckInScreenProps {
  /** Optional staff ID to perform check-ins. */
  currentStaffId?: string
}

export function CheckInScreen({ currentStaffId }: CheckInScreenProps) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  const [memberships, setMemberships] = useState<Membership[]>([])
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

  const inputRef = useRef<HTMLInputElement>(null)
  const { search, checkIn, searchLoading, error: apiError } = useMembershipsApi()

  // Modal state for detail & renewal
  const [detailMembershipId, setDetailMembershipId] = useState<string | null>(null)
  const [renewingMembership, setRenewingMembership] = useState<Membership | null>(null)

  // Track if input is currently being debounced (300ms delay has not passed yet)
  const isDebouncing = query !== debouncedQuery

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const firstAvailable = memberships.find((m) => !isMembershipExhausted(m) && !m.checked_in_today)
      if (firstAvailable && checkingInId !== firstAvailable.id) {
        void handleCheckIn(firstAvailable.id)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleClear()
    }
  }

  async function handleCheckIn(membershipId: string) {
    const membership = memberships.find((m) => m.id === membershipId)
    if (!membership || isMembershipExhausted(membership)) return

    // Snapshot for rollback
    const previousSessionsLeft = membership.sessions_left

    // Disable button immediately (prevents double-click)
    setCheckingInId(membershipId)
    setCheckInMessage(null)

    // Optimistic update: decrement by 1 right now
    setMemberships((prev) =>
      prev.map((m) =>
        m.id === membershipId && m.sessions_left !== null
          ? { ...m, sessions_left: m.sessions_left - 1 }
          : m,
      ),
    )

    try {
      const result = await checkIn(membershipId, currentStaffId)
      // Apply server-confirmed value
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
      // Rollback to the state before the optimistic update
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === membershipId
            ? { ...m, sessions_left: previousSessionsLeft }
            : m,
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

  async function handleQRScan(scannedText: string) {
    setIsQRScannerOpen(false)
    const targetId = extractMembershipIdFromQR(scannedText)

    // 1. Search locally in `memberships` list
    const existing = memberships.find((m) => m.id === targetId || m.phone === targetId)
    if (existing) {
      void handleCheckIn(existing.id)
      return
    }

    // 2. Search via API with targetId
    try {
      const results = await search(targetId)
      if (results.length > 0) {
        setMemberships(results)
        const matched = results.find((m) => m.id === targetId || m.phone === targetId) ?? results[0]
        if (matched && !isMembershipExhausted(matched)) {
          void handleCheckIn(matched.id)
        }
      } else {
        setToast({
          message: "Không tìm thấy hội viên từ mã QR này",
          type: "error",
        })
      }
    } catch {
      setToast({
        message: "Không thể kiểm tra mã QR",
        type: "error",
      })
    }
  }

  const isLoading = searchLoading || isDebouncing

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <UserCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Check-in Hội Viên
          </h2>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Tìm kiếm theo tên hoặc số điện thoại để điểm danh hội viên
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsQRScannerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 dark:shadow-none"
        >
          <QrCode className="h-5 w-5" />
          <span>Quét mã QR</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 h-6 w-6 text-slate-400"
          />

          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Tìm kiếm hội viên theo tên hoặc số điện thoại"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tên hoặc số điện thoại (ví dụ: 0901234567)..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-lg font-medium text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 sm:py-5"
          />

          {isLoading ? (
            <div
              role="status"
              aria-label="Đang tìm kiếm..."
              className="absolute right-4"
            >
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa nội dung tìm kiếm"
              className="absolute right-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-6 w-6" />
            </button>
          ) : null}
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Results Section */}
      {query.trim() === "" ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Nhập tên hoặc SĐT để bắt đầu
          </h3>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Hệ thống sẽ hiển thị danh sách gói tập tương ứng để bạn thực hiện điểm danh.
          </p>
        </div>
      ) : !isLoading && memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy hội viên phù hợp
          </h3>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Không có kết quả nào cho từ khóa &ldquo;
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {query}
            </span>
            &rdquo;. Vui lòng kiểm tra lại thông tin.
          </p>
        </div>
      ) : (
        <MembershipResultList
          memberships={memberships}
          checkingInId={checkingInId}
          checkInMessage={checkInMessage}
          onCheckIn={(id) => void handleCheckIn(id)}
          onRenew={(m) => setRenewingMembership(m)}
          onViewDetail={(id) => setDetailMembershipId(id)}
        />
      )}

      {/* Membership Detail & History Modal */}
      {detailMembershipId && (
        <MembershipDetailModal
          membershipId={detailMembershipId}
          onClose={() => setDetailMembershipId(null)}
        />
      )}

      {/* Renewal Modal */}
      {renewingMembership && (
        <RenewalModal
          membership={renewingMembership}
          onClose={() => setRenewingMembership(null)}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  )
}

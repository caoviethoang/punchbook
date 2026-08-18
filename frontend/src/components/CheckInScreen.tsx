import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Package as PackageIcon,
  RefreshCw,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react"
import { useDebounce } from "../hooks/useDebounce"
import { useMembershipsApi } from "../hooks/useMembershipsApi"
import {
  isMembershipExhausted,
  type Membership,
} from "../lib/memberships"
import { RenewalModal } from "./RenewalModal"

interface CheckInScreenProps {
  /** Optional staff ID to perform check-ins. */
  currentStaffId?: string
}

// ─── Remaining indicator ──────────────────────────────────────────────────────

interface RemainingProps {
  sessionsLeft: number | null
  expiresAt: string | null
}

function RemainingIndicator({ sessionsLeft, expiresAt }: RemainingProps) {
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false
  const hasNoSessions = sessionsLeft === 0

  if (hasNoSessions) {
    return (
      <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-red-50 px-4 py-3 text-center dark:bg-red-950/40">
        <span className="text-2xl font-extrabold leading-none text-red-600 dark:text-red-400">
          0
        </span>
        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-500">
          buổi còn lại
        </span>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-amber-50 px-4 py-3 text-center dark:bg-amber-950/40">
        <Calendar className="h-6 w-6 text-amber-500 dark:text-amber-400" />
        <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Đã hết hạn
        </span>
      </div>
    )
  }

  if (sessionsLeft !== null) {
    return (
      <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-emerald-50 px-4 py-3 text-center dark:bg-emerald-950/40">
        <span className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">
          {sessionsLeft}
        </span>
        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
          buổi còn lại
        </span>
      </div>
    )
  }

  // Session-unlimited membership — show expiry date if available
  if (expiresAt) {
    const formatted = new Date(expiresAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    return (
      <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-indigo-50 px-4 py-3 text-center dark:bg-indigo-950/40">
        <span className="text-base font-bold leading-tight text-indigo-700 dark:text-indigo-300">
          {formatted}
        </span>
        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
          hạn dùng
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-center dark:bg-slate-800">
      <span className="text-xl font-bold text-slate-600 dark:text-slate-300">∞</span>
      <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        không giới hạn
      </span>
    </div>
  )
}

// ─── Result list ──────────────────────────────────────────────────────────────

interface MembershipResultListProps {
  memberships: Membership[]
  checkingInId: string | null
  checkInMessage: { id: string; type: "success" | "error"; text: string } | null
  onCheckIn: (id: string) => void
  onRenew: (membership: Membership) => void
}

function MembershipResultList({
  memberships,
  checkingInId,
  checkInMessage,
  onCheckIn,
  onRenew,
}: MembershipResultListProps) {
  return (
    <div role="list" aria-label="Danh sách hội viên" className="grid gap-4">
      {memberships.map((membership) => {
        const isCheckingIn = checkingInId === membership.id
        const isExhausted = isMembershipExhausted(membership)
        const isDisabled = isCheckingIn || isExhausted
        const currentMessage =
          checkInMessage?.id === membership.id ? checkInMessage : null

        return (
          <div
            key={membership.id}
            role="listitem"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50 sm:gap-6 sm:p-6"
          >
            {/* Col 1: Customer name + phone */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                {membership.customer_name}
              </p>
              <p className="mt-0.5 text-base text-slate-500 dark:text-slate-400">
                {membership.phone}
              </p>
              {currentMessage && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${
                    currentMessage.type === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {currentMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{currentMessage.text}</span>
                </div>
              )}
            </div>

            {/* Col 2: Package badge */}
            <div className="hidden shrink-0 sm:block sm:w-44">
              <div className="inline-flex items-start gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 dark:bg-indigo-950/60">
                <PackageIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="text-base font-semibold leading-snug text-indigo-700 dark:text-indigo-300 line-clamp-2">
                  {membership.package.name}
                </span>
              </div>
            </div>

            {/* Col 3: Remaining sessions / expiry */}
            <div className="shrink-0">
              <RemainingIndicator
                sessionsLeft={membership.sessions_left}
                expiresAt={membership.expires_at}
              />
            </div>

            {/* Col 4: Action buttons (Gia hạn + Check-in) */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onRenew(membership)}
                title="Gia hạn gói"
                aria-label={`Gia hạn cho ${membership.customer_name}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Gia hạn</span>
              </button>

              <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isExhausted) return
                  onCheckIn(membership.id)
                }}
                aria-disabled={isExhausted}
                aria-label={
                  isExhausted
                    ? `${membership.customer_name} đã hết — không thể check-in`
                    : `Check-in cho ${membership.customer_name}`
                }
                className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:min-w-36 ${
                  isExhausted
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                }`}
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Check-in...</span>
                  </>
                ) : isExhausted ? (
                  <span>Đã hết</span>
                ) : (
                  <>
                    <UserCheck className="h-5 w-5" />
                    <span>Check-in</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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

  const inputRef = useRef<HTMLInputElement>(null)
  const { search, checkIn, searchLoading, error: apiError } = useMembershipsApi()

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

  function toVietnameseError(err: unknown): string {
    const raw = err instanceof Error ? err.message : ""
    if (raw === "Membership has no sessions left") return "Hội viên đã hết buổi."
    if (raw === "Membership has expired") return "Thẻ thành viên đã hết hạn."
    if (raw === "Unauthorized" || raw === "NetworkError") return "Mất kết nối. Vui lòng thử lại."
    if (!raw || raw === "Request failed") return "Check-in thất bại. Vui lòng thử lại."
    return raw
  }

  async function handleCheckIn(membershipId: string) {
    const membership = memberships.find((m) => m.id === membershipId)
    if (!membership || isMembershipExhausted(membership)) return

    if (!currentStaffId) {
      setCheckInMessage({
        id: membershipId,
        type: "error",
        text: "Vui lòng chọn nhân viên thực hiện check-in.",
      })
      return
    }

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
            ? { ...m, sessions_left: result.membership.sessions_left }
            : m,
        ),
      )
      setCheckInMessage({
        id: membershipId,
        type: "success",
        text: `Check-in thành công! (Còn lại ${result.membership.sessions_left ?? "không giới hạn"} buổi)`,
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
        text: toVietnameseError(err),
      })
    } finally {
      setCheckingInId(null)
    }
  }

  const [selectedMembershipForRenewal, setSelectedMembershipForRenewal] =
    useState<Membership | null>(null)

  const showLoading = searchLoading

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <UserCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Check-in Hội Viên
        </h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          Tra cứu nhanh theo tên hoặc số điện thoại hội viên
        </p>
      </div>

      {/* Search Box */}
      <div>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-5 flex items-center">
            {showLoading || isDebouncing ? (
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Search className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ tên hoặc số điện thoại hội viên..."
            autoFocus
            aria-label="Tìm kiếm hội viên"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-5 pl-16 pr-14 text-xl font-medium text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/50"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa"
              className="absolute right-4 rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Status bar */}
        <div className="mt-2 flex items-center justify-between px-1 text-sm">
          <span className="text-slate-400 dark:text-slate-500">
            {isDebouncing ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                <Clock className="h-4 w-4 animate-pulse" />
                Đang chờ dừng gõ (300ms debounce)...
              </span>
            ) : debouncedQuery.trim() ? (
              <span>
                Kết quả cho: &ldquo;
                <strong className="text-slate-700 dark:text-slate-300">
                  {debouncedQuery.trim()}
                </strong>
                &rdquo;
              </span>
            ) : (
              <span>Danh sách hội viên mới nhất</span>
            )}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {memberships.length} kết quả
          </span>
        </div>
      </div>

      {/* Global Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Results */}
      <div>
        {showLoading && memberships.length === 0 ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex animate-pulse items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-32 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                </div>
                <div className="hidden h-12 w-40 rounded-xl bg-slate-100 dark:bg-slate-800/60 sm:block" />
                <div className="h-16 w-24 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-12 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : memberships.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Không tìm thấy hội viên nào
            </h3>
            <p className="mt-2 max-w-sm text-base text-slate-500 dark:text-slate-400">
              {debouncedQuery.trim()
                ? `Không có hội viên nào khớp với từ khóa "${debouncedQuery.trim()}". Hãy thử kiểm tra lại tên hoặc số điện thoại.`
                : "Chưa có dữ liệu hội viên."}
            </p>
            {debouncedQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-5 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <MembershipResultList
            memberships={memberships}
            checkingInId={checkingInId}
            checkInMessage={checkInMessage}
            onCheckIn={handleCheckIn}
            onRenew={(membership) => setSelectedMembershipForRenewal(membership)}
          />
        )}
      </div>

      {selectedMembershipForRenewal && (
        <RenewalModal
          membership={selectedMembershipForRenewal}
          onClose={() => setSelectedMembershipForRenewal(null)}
        />
      )}
    </div>
  )
}

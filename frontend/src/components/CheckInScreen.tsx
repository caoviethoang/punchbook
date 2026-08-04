import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Package as PackageIcon,
  Phone,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react"
import { useDebounce } from "../hooks/useDebounce"
import { useMembershipsApi } from "../hooks/useMembershipsApi"
import type { Membership } from "../lib/memberships"

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

  const inputRef = useRef<HTMLInputElement>(null)
  const { search, checkIn, loading: apiLoading, error: apiError } = useMembershipsApi()

  // Track if input is currently being debounced (user typed, but 300ms delay has not passed yet)
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

  async function handleCheckIn(membershipId: string) {
    if (!currentStaffId) {
      setCheckInMessage({
        id: membershipId,
        type: "error",
        text: "Vui lòng chọn nhân viên thực hiện check-in",
      })
      return
    }

    setCheckingInId(membershipId)
    setCheckInMessage(null)

    try {
      const result = await checkIn(membershipId, currentStaffId)
      // Update local state for immediate feedback
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
      const msg = err instanceof Error ? err.message : "Check-in thất bại"
      setCheckInMessage({
        id: membershipId,
        type: "error",
        text: msg,
      })
    } finally {
      setCheckingInId(null)
    }
  }

  const showLoading = apiLoading

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <UserCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Check-in Hội Viên
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tra cứu nhanh theo tên hoặc số điện thoại hội viên
          </p>
        </div>
      </div>

      {/* Staff-First Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-4 flex items-center text-slate-400">
            {showLoading || isDebouncing ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Search className="h-6 w-6 text-slate-400 dark:text-slate-500" />
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
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 pl-13 pr-12 text-lg font-medium text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/50"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa"
              className="absolute right-3.5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Debounce & Status Bar */}
        <div className="mt-2 flex items-center justify-between px-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            {isDebouncing ? (
              <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                Đang chờ dừng gõ (300ms debounce)...
              </span>
            ) : debouncedQuery.trim() ? (
              <span>
                Kết quả cho: &ldquo;<strong className="text-slate-700 dark:text-slate-300">{debouncedQuery.trim()}</strong>&rdquo;
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
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Results / Empty / Loading Section */}
      <div className="space-y-3">
        {showLoading && memberships.length === 0 ? (
          /* Loading Skeletons */
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex animate-pulse items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-28 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                </div>
                <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : memberships.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <User className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Không tìm thấy hội viên nào
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {debouncedQuery.trim()
                ? `Không có hội viên nào khớp với từ khóa "${debouncedQuery.trim()}". Hãy thử kiểm tra lại tên hoặc số điện thoại.`
                : "Chưa có dữ liệu hội viên."}
            </p>
            {debouncedQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          /* Membership List */
          <div className="grid gap-3">
            {memberships.map((membership) => {
              const isCheckingIn = checkingInId === membership.id
              const hasNoSessionsLeft = membership.sessions_left === 0
              const isExpired =
                membership.expires_at &&
                new Date(membership.expires_at) < new Date()

              const isDisabled = hasNoSessionsLeft || isExpired
              const currentMessage =
                checkInMessage?.id === membership.id ? checkInMessage : null

              return (
                <div
                  key={membership.id}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        {membership.customer_name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <PackageIcon className="h-3 w-3" />
                        {membership.package.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {membership.phone}
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium">
                        Số buổi còn lại:{" "}
                        <strong
                          className={
                            hasNoSessionsLeft
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {membership.sessions_left ?? "Không giới hạn"}
                        </strong>
                      </span>

                      {membership.expires_at && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Calendar className="h-3.5 w-3.5" />
                          Hạn: {new Date(membership.expires_at).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>

                    {currentMessage && (
                      <div
                        className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                          currentMessage.type === "success"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {currentMessage.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>{currentMessage.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={isCheckingIn}
                      onClick={() => handleCheckIn(membership.id)}
                      className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isDisabled
                          ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      }`}
                    >
                      {isCheckingIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Check-in...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Check-in
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

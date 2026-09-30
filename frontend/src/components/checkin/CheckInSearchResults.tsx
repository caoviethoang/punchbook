import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  Package as PackageIcon,
  Printer,
  RefreshCw,
  UserCheck,
} from "lucide-react"
import {
  isMembershipExhausted,
  type Membership,
} from "../../lib/memberships"
import { formatDate } from "../../lib/formatters"

// ─── Remaining indicator ──────────────────────────────────────────────────────

interface RemainingProps {
  sessionsLeft: number | null
  expiresAt: string | null
}

export function RemainingIndicator({ sessionsLeft, expiresAt }: RemainingProps) {
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
    return (
      <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-indigo-50 px-4 py-3 text-center dark:bg-indigo-950/40">
        <span className="text-base font-bold leading-tight text-indigo-700 dark:text-indigo-300">
          {formatDate(expiresAt)}
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

export interface MembershipResultListProps {
  memberships: Membership[]
  checkingInId: string | null
  checkInMessage: { id: string; type: "success" | "error"; text: string } | null
  onCheckIn: (id: string) => void
  onRenew: (membership: Membership) => void
  onViewDetail: (id: string) => void
  onPrintReceipt?: (membership: Membership) => void
}

function formatCheckInTime(dateStr?: string | null): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

export function MembershipResultList({
  memberships,
  checkingInId,
  checkInMessage,
  onCheckIn,
  onRenew,
  onViewDetail,
  onPrintReceipt,
}: MembershipResultListProps) {
  return (
    <div role="list" aria-label="Danh sách hội viên" className="grid gap-4">
      {memberships.map((membership) => {
        const isCheckingIn = checkingInId === membership.id
        const isExhausted = isMembershipExhausted(membership)
        const isAlreadyCheckedIn = Boolean(membership.checked_in_today)
        const isDisabled = isCheckingIn || isExhausted || isAlreadyCheckedIn
        const currentMessage =
          checkInMessage?.id === membership.id ? checkInMessage : null
        const checkInTime = formatCheckInTime(membership.last_checked_in_at)

        return (
          <div
            key={membership.id}
            role="listitem"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50 sm:gap-6 sm:p-6"
          >
            {/* Col 1: Customer name + package badge + phone */}
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onViewDetail(membership.id)}
                className="w-full text-left group/btn focus:outline-none"
              >
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <p className="truncate text-xl font-bold tracking-tight text-slate-900 group-hover/btn:text-indigo-600 dark:text-slate-50 dark:group-hover/btn:text-indigo-400 sm:text-2xl">
                    {membership.customer_name}
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <PackageIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{membership.package.name}</span>
                  </span>
                  {membership.checked_in_today && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Đã check-in hôm nay{checkInTime ? ` (${checkInTime})` : ""}
                      </span>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                  {membership.phone}
                </p>
              </button>
              {currentMessage && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div
                    className={`flex items-center gap-1.5 text-sm font-medium ${
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
                  {currentMessage.type === "success" && onPrintReceipt && (
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(membership)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      In phiếu ngay
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Col 3: Remaining sessions / expiry */}
            <div className="shrink-0">
              <RemainingIndicator
                sessionsLeft={membership.sessions_left}
                expiresAt={membership.expires_at}
              />
            </div>

            {/* Col 4: Action buttons (In phiếu + Chi tiết + Gia hạn + Check-in) */}
            <div className="flex shrink-0 items-center gap-2">
              {onPrintReceipt && (
                <button
                  type="button"
                  onClick={() => onPrintReceipt(membership)}
                  title="In phiếu check-in (POS)"
                  aria-label={`In phiếu check-in cho ${membership.customer_name}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewDetail(membership.id)}
                title="Xem chi tiết & lịch sử"
                aria-label={`Xem chi tiết cho ${membership.customer_name}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eye className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Chi tiết</span>
              </button>

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
                  if (isExhausted || isAlreadyCheckedIn) return
                  onCheckIn(membership.id)
                }}
                aria-disabled={isExhausted || isAlreadyCheckedIn}
                aria-label={
                  isCheckingIn
                    ? `Đang check-in cho ${membership.customer_name}`
                    : isExhausted
                      ? `${membership.customer_name} đã hết — không thể check-in`
                      : isAlreadyCheckedIn
                        ? `${membership.customer_name} đã check-in hôm nay`
                        : `Check-in cho ${membership.customer_name}`
                }
                className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:min-w-36 ${
                  isCheckingIn
                    ? "bg-indigo-600 text-white opacity-70"
                    : isExhausted
                      ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                      : isAlreadyCheckedIn
                        ? "cursor-not-allowed bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
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
                ) : isAlreadyCheckedIn ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Đã Check-in</span>
                  </>
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

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
import { computeMembershipStatus, isMembershipExhausted, type Membership } from "../../lib/memberships"
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
      <div className="flex w-24 sm:w-28 shrink-0 h-12 sm:h-13 flex-col items-center justify-center rounded-xl bg-red-50 px-2 py-1 text-center dark:bg-red-950/40">
        <span className="text-xl font-bold leading-none text-red-600 dark:text-red-400 sm:text-2xl">
          0
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-500 sm:text-[11px]">
          buổi còn lại
        </span>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="flex w-24 sm:w-28 shrink-0 h-12 sm:h-13 flex-col items-center justify-center rounded-xl bg-amber-50 px-2 py-1 text-center dark:bg-amber-950/40">
        <Calendar className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 sm:text-[11px]">
          Đã hết hạn
        </span>
      </div>
    )
  }

  if (sessionsLeft !== null) {
    const isExpiring = sessionsLeft <= 3 && sessionsLeft > 0
    return (
      <div
        className={`flex w-24 sm:w-28 shrink-0 h-12 sm:h-13 flex-col items-center justify-center rounded-xl px-2 py-1 text-center ${
          isExpiring
            ? "bg-amber-50 dark:bg-amber-950/40"
            : "bg-emerald-50 dark:bg-emerald-950/40"
        }`}
      >
        <span
          className={`text-xl font-bold leading-none sm:text-2xl ${
            isExpiring
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {sessionsLeft}
        </span>
        <span
          className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${
            isExpiring
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-500"
          }`}
        >
          {isExpiring ? "sắp hết buổi" : "buổi còn lại"}
        </span>
      </div>
    )
  }

  // Session-unlimited membership — show expiry date if available
  if (expiresAt) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiresAt)
    expiry.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isExpiring = diffDays <= 7 && diffDays > 0

    return (
      <div
        className={`flex w-24 sm:w-28 shrink-0 h-12 sm:h-13 flex-col items-center justify-center rounded-xl px-2 py-1 text-center ${
          isExpiring
            ? "bg-amber-50 dark:bg-amber-950/40"
            : "bg-indigo-50 dark:bg-indigo-950/40"
        }`}
      >
        <span
          className={`text-xs font-bold leading-tight sm:text-sm ${
            isExpiring
              ? "text-amber-700 dark:text-amber-300"
              : "text-indigo-700 dark:text-indigo-300"
          }`}
        >
          {formatDate(expiresAt)}
        </span>
        <span
          className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${
            isExpiring
              ? "text-amber-600 dark:text-amber-400"
              : "text-indigo-500 dark:text-indigo-400"
          }`}
        >
          {isExpiring ? `còn ${diffDays} ngày` : "hạn dùng"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-24 sm:w-28 shrink-0 h-12 sm:h-13 flex-col items-center justify-center rounded-xl bg-slate-100 px-2 py-1 text-center dark:bg-slate-800">
      <span className="text-lg font-bold text-slate-600 dark:text-slate-300 sm:text-xl">∞</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[11px]">
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
    <div role="list" aria-label="Danh sách hội viên" className="grid gap-2.5 sm:gap-3">
      {memberships.map((membership) => {
        const isCheckingIn = checkingInId === membership.id
        const isExhausted = isMembershipExhausted(membership)
        const isAlreadyCheckedIn = Boolean(membership.checked_in_today)
        const isDisabled = isCheckingIn || isAlreadyCheckedIn
        const currentMessage = checkInMessage?.id === membership.id ? checkInMessage : null
        const checkInTime = formatCheckInTime(membership.last_checked_in_at)

        return (
          <div
            key={membership.id}
            role="listitem"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs transition hover:border-indigo-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50 sm:gap-4 sm:px-5 sm:py-3.5"
          >
            {/* Col 1: Customer name + phone, package badge + status */}
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onViewDetail(membership.id)}
                className="w-full text-left group/btn focus:outline-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-slate-900 group-hover/btn:text-indigo-600 dark:text-slate-50 dark:group-hover/btn:text-indigo-400 sm:text-lg">
                    {membership.customer_name}
                  </p>
                  <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                  <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    {membership.phone}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <PackageIcon className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{membership.package.name}</span>
                  </span>
                  {membership.checked_in_today && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Đã check-in{checkInTime ? ` (${checkInTime})` : ""}</span>
                    </span>
                  )}
                  {computeMembershipStatus(membership) === "expiring" && !isExhausted && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <AlertCircle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Sắp hết hạn</span>
                    </span>
                  )}
                </div>
              </button>
              {currentMessage && (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div
                    className={`flex items-center gap-1 text-xs font-medium sm:text-sm ${
                      currentMessage.type === "success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {currentMessage.type === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{currentMessage.text}</span>
                  </div>
                  {currentMessage.type === "success" && onPrintReceipt && (
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(membership)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <Printer className="h-3 w-3" />
                      In phiếu ngay
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Col 2: Remaining sessions / expiry */}
            <div className="shrink-0">
              <RemainingIndicator
                sessionsLeft={membership.sessions_left}
                expiresAt={membership.expires_at}
              />
            </div>

            {/* Col 3: Action buttons (In phiếu + Chi tiết + Gia hạn + Check-in) */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {onPrintReceipt && (
                <button
                  type="button"
                  onClick={() => onPrintReceipt(membership)}
                  title="In phiếu check-in (POS)"
                  aria-label={`In phiếu check-in cho ${membership.customer_name}`}
                  className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewDetail(membership.id)}
                title="Xem chi tiết & lịch sử"
                aria-label={`Xem chi tiết cho ${membership.customer_name}`}
                className="inline-flex h-8 sm:h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3 sm:text-sm"
              >
                <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Chi tiết</span>
              </button>

              <button
                type="button"
                onClick={() => onRenew(membership)}
                title="Gia hạn gói"
                aria-label={`Gia hạn cho ${membership.customer_name}`}
                className="inline-flex h-8 sm:h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3 sm:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Gia hạn</span>
              </button>

              <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isAlreadyCheckedIn) return
                  onCheckIn(membership.id)
                }}
                aria-disabled={isAlreadyCheckedIn}
                aria-label={
                  isCheckingIn
                    ? `Đang check-in cho ${membership.customer_name}`
                    : isAlreadyCheckedIn
                      ? `${membership.customer_name} đã check-in hôm nay`
                      : isExhausted
                        ? `Gia hạn và check-in cho ${membership.customer_name}`
                        : `Check-in cho ${membership.customer_name}`
                }
                className={`inline-flex h-8 sm:h-9 w-28 sm:w-32 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm ${
                  isCheckingIn
                    ? "bg-indigo-600 text-white opacity-70"
                    : isAlreadyCheckedIn
                      ? "cursor-not-allowed bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
                      : isExhausted
                        ? "bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                }`}
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                    <span>Check-in...</span>
                  </>
                ) : isAlreadyCheckedIn ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Đã Check-in</span>
                  </>
                ) : isExhausted ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Gia hạn & CI</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
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

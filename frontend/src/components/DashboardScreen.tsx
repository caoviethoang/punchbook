import { useEffect, useState, type ReactNode } from "react"
import { AlertCircle, CalendarClock, Loader2, RefreshCw, Users, Wallet } from "lucide-react"
import { useDashboard } from "../hooks/useDashboard"
import type { DashboardMembership, MembershipStatus } from "../lib/dashboard"
import { RenewalModal } from "./RenewalModal"

const statusLabel: Record<MembershipStatus, string> = {
  active: "Còn hạn",
  expiring: "Sắp hết",
  expired: "Đã hết",
}

const statusClass: Record<MembershipStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  expiring:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  expired: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

function remainingLabel(membership: DashboardMembership): string {
  if (membership.sessions_left !== null) {
    return `${membership.sessions_left} buổi`
  }
  if (membership.expires_at) {
    return new Date(membership.expires_at).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }
  return "—"
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  )
}

export function DashboardScreen() {
  const { data, loading, error, load } = useDashboard()
  const [selectedMembershipForRenewal, setSelectedMembershipForRenewal] =
    useState<DashboardMembership | null>(null)

  useEffect(() => {
    void load().catch(() => {
      // Error surfaced via hook state.
    })
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-4 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:mx-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Dashboard
        </h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          Tình hình shop trong tháng này
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Doanh thu tháng"
          value={formatVnd(data.revenue_this_month)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <Metric
          label="Hội viên active"
          value={String(data.active_memberships_count)}
          icon={<Users className="h-4 w-4" />}
        />
        <Metric
          label="Sắp hết hạn (7 ngày)"
          value={String(data.expiring_within_7_days_count)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Hội viên
          </h3>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            {data.memberships.length} hội viên
          </span>
        </div>

        {data.memberships.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Chưa có hội viên nào.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên</th>
                  <th className="px-4 py-3 font-semibold">Gói</th>
                  <th className="px-4 py-3 font-semibold">Còn lại</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.memberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        {membership.customer_name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {membership.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {membership.package.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {remainingLabel(membership)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[membership.status]}`}
                      >
                        {statusLabel[membership.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMembershipForRenewal(membership)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Gia hạn</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

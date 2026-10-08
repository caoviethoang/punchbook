import { ShieldCheck, Sparkles, Zap } from "lucide-react"
import type { Shop } from "../../lib/auth"
import { formatDate } from "../../lib/formatters"

interface SubscriptionSectionProps {
  shop: Shop
  isAdmin: boolean
  daysLeft: number
  showRenewalButton: boolean
  onOpenUpgradeModal: () => void
}

export function SubscriptionSection({
  shop,
  isAdmin,
  daysLeft,
  showRenewalButton,
  onOpenUpgradeModal,
}: SubscriptionSectionProps) {
  const formatExpirationDate = (dateStr?: string | null) =>
    dateStr ? formatDate(dateStr) : "Không thời hạn"

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Thông tin Gói cước
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chi tiết trạng thái tài khoản và thời hạn đăng ký dịch vụ PunchBook.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
              shop.plan === "paid"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {shop.plan === "paid" && <Sparkles className="h-3.5 w-3.5 fill-current text-amber-500" />}
            Gói {shop.plan === "paid" ? "Premium (Paid)" : "Miễn phí (Free)"}
          </span>

          {isAdmin && showRenewalButton && (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-amber-600 hover:to-indigo-700"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>
                {shop.plan === "paid"
                  ? daysLeft <= 5
                    ? `Sắp hết hạn (${daysLeft} ngày) - Gia hạn ngay`
                    : "Gia hạn Premium"
                  : "Nâng cấp Premium"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tài khoản Email</span>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{shop.email}</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loại gói dịch vụ</span>
          <p className="mt-1 font-semibold capitalize text-slate-900 dark:text-slate-100">
            {shop.plan === "paid" ? "Trả phí (Paid)" : "Miễn phí (Free)"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ngày hết hạn gói</span>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {formatExpirationDate(shop.plan_expires_at)}
          </p>
        </div>
      </div>

      {/* Upgrade Banner for Free Plan */}
      {shop.plan !== "paid" && isAdmin && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-md sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400 fill-current" />
              <h4 className="text-base font-extrabold text-white">Nâng cấp lên PunchBook Premium</h4>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Mở khóa không giới hạn hội viên, báo cáo doanh thu chi tiết và tự động nhắc nợ Zalo/SMS.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="shrink-0 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow transition hover:bg-amber-300"
          >
            Nâng cấp ngay - Chỉ từ 199.000đ/tháng
          </button>
        </div>
      )}
    </section>
  )
}

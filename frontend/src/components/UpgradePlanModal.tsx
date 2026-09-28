import { useState } from "react"
import { Sparkles, CheckCircle2, ShieldCheck, X, Loader2, Copy, Check, Zap } from "lucide-react"
import type { Shop } from "../lib/auth"
import { upgradeShopPlan } from "../lib/settings"
import { formatVnd } from "../lib/formatters"

interface UpgradePlanModalProps {
  shop: Shop
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedShop: Shop) => void
}

interface PlanOption {
  months: number
  label: string
  price: number
  popular: boolean
  discount: string
  badgeText?: string
  features: string[]
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    months: 1,
    label: "1 Tháng",
    price: 199000,
    popular: false,
    discount: "",
    badgeText: "Gói Tiêu Chuẩn",
    features: [
      "Quản lý tối đa 500 hội viên",
      "Tự động gửi Zalo ZNS / SMS nhắc nhở điểm danh",
      "Xuất báo cáo doanh thu & điểm danh cơ bản",
      "Hỗ trợ kỹ thuật qua Chat / Email (Giờ hành chính)",
      "Quản lý đầy đủ gói cước & phương thức thanh toán VietQR",
    ],
  },
  {
    months: 12,
    label: "1 Năm (12 tháng)",
    price: 1990000,
    popular: true,
    discount: "Tiết kiệm 17%",
    badgeText: "Gói VIP Đặc Quyền",
    features: [
      "🚀 KHÔNG GIỚI HẠN số lượng hội viên",
      "💎 Tính năng Import & Export dữ liệu Excel nâng cao",
      "🎨 Tùy chỉnh logo & thông tin cửa hàng trên mã QR",
      "🎁 Tặng thêm 02 tháng sử dụng hoàn toàn miễn phí",
      "👑 Tự động cập nhật các tính năng mới nhất",
      "☎️ Hỗ trợ kỹ thuật VIP 1-1 qua Zalo / Hotline 24/7",
    ],
  },
]

export function UpgradePlanModal({
  shop,
  isOpen,
  onClose,
  onSuccess,
}: UpgradePlanModalProps) {
  const [selectedMonths, setSelectedMonths] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedContent, setCopiedContent] = useState(false)

  if (!isOpen) return null

  const selectedOption = PLAN_OPTIONS.find((o) => o.months === selectedMonths) || PLAN_OPTIONS[1]
  const transferContent = `PUNCHBOOK ${shop.id.substring(0, 8).toUpperCase()}`

  // VietQR Image URL for Quick Pay
  const vietQrUrl = `https://img.vietqr.io/image/MB-0346384750-compact2.png?amount=${selectedOption.price}&addInfo=${encodeURIComponent(
    transferContent,
  )}&accountName=CAO%20VIET%20HOANG`

  async function handleConfirmUpgrade() {
    setLoading(true)
    setError(null)

    try {
      const res = await upgradeShopPlan(selectedMonths)
      onSuccess(res.shop)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nâng cấp gói thất bại. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  function handleCopyContent() {
    void navigator.clipboard.writeText(transferContent)
    setCopiedContent(true)
    setTimeout(() => setCopiedContent(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Đóng</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
            <Sparkles className="h-6 w-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                Nâng cấp Gói PunchBook Premium
              </h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mở khóa toàn bộ tính năng cao cấp không giới hạn cho cửa hàng của bạn
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Left Column: Plan Options & Features */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Chọn thời hạn đăng ký
            </h4>

            <div className="space-y-2.5">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                    selectedMonths === opt.months
                      ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-850"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </span>
                      {opt.discount && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {opt.discount}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatVnd(opt.price)}
                    </p>
                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      selectedMonths === opt.months
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selectedMonths === opt.months && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quyền lợi gói ({selectedOption.label})
              </h4>
              {selectedOption.badgeText && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {selectedOption.badgeText}
                </span>
              )}
            </div>
            <ul className="space-y-2.5">
              {selectedOption.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: VietQR Payment details */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="w-full text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Quét mã VietQR Thanh toán
              </h4>

              <div className="mt-3 flex justify-center">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Chuyển khoản"
                    className="h-44 w-44 object-contain"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">MBBank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">0346384750</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">CAO VIET HOANG</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="flex items-center gap-1 font-mono font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <span>{transferContent}</span>
                    {copiedContent ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Để sau
          </button>

          <button
            type="button"
            onClick={() => void handleConfirmUpgrade()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-current" />
            )}
            <span>Xác nhận Kích hoạt Premium</span>
          </button>
        </div>
      </div>
    </div>
  )
}

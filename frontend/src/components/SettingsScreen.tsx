import { useState, type FormEvent } from "react"
import { Building2, CreditCard, KeyRound, ShieldCheck, Sparkles, Zap } from "lucide-react"
import type { Shop } from "../lib/auth"
import { toApiError } from "../lib/errors"
import { formatDate } from "../lib/formatters"
import { changeShopPassword, updateShopProfile } from "../lib/settings"
import { FormField, FORM_CONTROL_CLASS } from "./ui/FormField"
import { Toast } from "./ui/Toast"
import { UpgradePlanModal } from "./UpgradePlanModal"

const POPULAR_BANKS = [
  { code: "MBBank", name: "MBBank (Ngân hàng Quân Đội)" },
  { code: "Vietcombank", name: "Vietcombank (VCB)" },
  { code: "Techcombank", name: "Techcombank (TCB)" },
  { code: "VPBank", name: "VPBank" },
  { code: "ACB", name: "ACB" },
  { code: "VietinBank", name: "VietinBank (CTG)" },
  { code: "BIDV", name: "BIDV" },
  { code: "TPBank", name: "TPBank" },
  { code: "VIB", name: "VIB" },
  { code: "Sacombank", name: "Sacombank" },
  { code: "Agribank", name: "Agribank" },
]

interface SettingsScreenProps {
  shop: Shop
  onShopUpdated: (updatedShop: Shop) => void
}

export function SettingsScreen({ shop, onShopUpdated }: SettingsScreenProps) {
  // Profile form state
  const [name, setName] = useState(shop.name || "")
  const [phone, setPhone] = useState(shop.phone || "")
  const [address, setAddress] = useState(shop.address || "")

  // Bank Account Settings state
  const [bankName, setBankName] = useState(shop.bank_name || "MBBank")
  const [bankAccountNo, setBankAccountNo] = useState(shop.bank_account_no || "")
  const [bankAccountName, setBankAccountName] = useState(shop.bank_account_name || "")

  const [profileLoading, setProfileLoading] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Upgrade Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      const res = await updateShopProfile({
        name,
        phone,
        address,
        bank_name: bankName,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName,
      })
      onShopUpdated(res.shop)
      setToast({
        message: res.message || "Cập nhật thông tin tiệm & tài khoản thành công!",
        type: "success",
      })
    } catch (err) {
      setToast({
        message: toApiError(err, "Cập nhật thất bại."),
        type: "error",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setToast({
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp!",
        type: "error",
      })
      return
    }

    setPasswordLoading(true)

    try {
      const res = await changeShopPassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      onShopUpdated(res.shop)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setToast({
        message: res.message || "Đổi mật khẩu thành công!",
        type: "success",
      })
    } catch (err) {
      setToast({
        message: toApiError(err, "Đổi mật khẩu thất bại."),
        type: "error",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const formatExpirationDate = (dateStr?: string | null) =>
    dateStr ? formatDate(dateStr) : "Không thời hạn"

  return (
    <div className="space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Cài đặt Cửa hàng & Tài khoản
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý thông tin chung, bảo mật tài khoản chủ tiệm và gói dịch vụ.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: Store Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Thông tin Cửa hàng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cập nhật tên tiệm, số điện thoại và địa chỉ liên hệ.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <FormField
              label="Tên cửa hàng"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lan Spa & Salon"
            />
            <FormField
              label="Số điện thoại liên hệ"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901234567"
            />
            <FormField
              label="Địa chỉ tiệm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Đường Nguyễn Trãi, Quận 1, TP.HCM"
            />

            {/* Bank Account Settings for VietQR */}
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tài khoản Ngân hàng (Xuất QR Chuyển khoản)
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ngân hàng
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={FORM_CONTROL_CLASS}
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <FormField
                  label="Số tài khoản ngân hàng"
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value.replace(/\s/g, ""))}
                  placeholder="VD: 0123456789"
                />

                <FormField
                  label="Tên chủ tài khoản"
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="VD: CAO VIET HOANG"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {profileLoading ? "Đang lưu..." : "Lưu thông tin tiệm & ngân hàng"}
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Password Change */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Đổi mật khẩu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bảo vệ tài khoản với mật khẩu mới.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormField
              label="Mật khẩu hiện tại"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <FormField
              label="Mật khẩu mới"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu tối thiểu 6 ký tự"
            />
            <FormField
              label="Xác nhận mật khẩu mới"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {passwordLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Section 3: Subscription Plan Info & Upgrade CTA */}
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

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-amber-600 hover:to-indigo-700"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{shop.plan === "paid" ? "Gia hạn Premium" : "Nâng cấp Premium"}</span>
            </button>
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
        {shop.plan !== "paid" && (
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
              onClick={() => setShowUpgradeModal(true)}
              className="shrink-0 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow transition hover:bg-amber-300"
            >
              Nâng cấp ngay - Chỉ từ 199.000đ/tháng
            </button>
          </div>
        )}
      </section>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        shop={shop}
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={(updatedShop) => {
          onShopUpdated(updatedShop)
          setToast({
            message: "Chúc mừng! Cửa hàng đã được nâng cấp lên gói Premium thành công.",
            type: "success",
          })
        }}
      />
    </div>
  )
}


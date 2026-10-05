import type { FormEvent } from "react"
import { Building2, CreditCard } from "lucide-react"
import { FormField, FORM_CONTROL_CLASS } from "../ui/FormField"

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

interface ShopProfileSectionProps {
  isAdmin: boolean
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  address: string
  setAddress: (v: string) => void
  bankName: string
  setBankName: (v: string) => void
  bankAccountNo: string
  setBankAccountNo: (v: string) => void
  bankAccountName: string
  setBankAccountName: (v: string) => void
  profileLoading: boolean
  onSubmit: (e: FormEvent) => void
}

export function ShopProfileSection({
  isAdmin,
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  bankName,
  setBankName,
  bankAccountNo,
  setBankAccountNo,
  bankAccountName,
  setBankAccountName,
  profileLoading,
  onSubmit,
}: ShopProfileSectionProps) {
  return (
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

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Tên cửa hàng"
          required
          disabled={!isAdmin}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Lan Spa & Salon"
        />
        <FormField
          label="Số điện thoại liên hệ"
          disabled={!isAdmin}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="VD: 0901234567"
        />
        <FormField
          label="Địa chỉ tiệm"
          disabled={!isAdmin}
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
                disabled={!isAdmin}
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
              disabled={!isAdmin}
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value.replace(/\s/g, ""))}
              placeholder="VD: 0123456789"
            />

            <FormField
              label="Tên chủ tài khoản"
              type="text"
              disabled={!isAdmin}
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
              placeholder="VD: CAO VIET HOANG"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={profileLoading || !isAdmin}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isAdmin
              ? "Chỉ xem (Không có quyền sửa)"
              : profileLoading
              ? "Đang lưu..."
              : "Lưu thông tin tiệm & ngân hàng"}
          </button>
        </div>
      </form>
    </section>
  )
}

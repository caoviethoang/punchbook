import { useEffect, useState } from "react"
import {
  Check,
  Copy,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { formatVndInput } from "../lib/formatters"
import { fetchSettings } from "../lib/settings"
import { getMembershipDetail } from "../lib/memberships"
import type { Shop } from "../lib/auth"
import { Modal } from "./ui/Modal"

interface RenewalModalProps {
  membership: {
    id: string
    customer_name: string
    phone: string
    package: {
      name: string
      price?: number
    }
  }
  onClose: () => void
}

export function RenewalModal({ membership, onClose }: RenewalModalProps) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [price, setPrice] = useState<number>(membership.package.price ?? 0)
  const [packageName, setPackageName] = useState<string>(membership.package.name)
  const [loading, setLoading] = useState(true)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      try {
        const [settingsRes, detailRes] = await Promise.allSettled([
          fetchSettings(),
          getMembershipDetail(membership.id),
        ])

        if (isCancelled) return

        if (settingsRes.status === "fulfilled") {
          setShop(settingsRes.value.shop)
        }

        if (detailRes.status === "fulfilled" && detailRes.value.package) {
          if (detailRes.value.package.price !== undefined) {
            setPrice(detailRes.value.package.price)
          }
          if (detailRes.value.package.name) {
            setPackageName(detailRes.value.package.name)
          }
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isCancelled = true
    }
  }, [membership.id])

  const bankName = shop?.bank_name
  const accountNo = shop?.bank_account_no
  const accountName = shop?.bank_account_name

  const hasBankConfig = Boolean(bankName && accountNo)

  const transferMemo = `Gia han ${membership.customer_name} ${membership.phone}`

  // VietQR standard API endpoint
  const vietQrUrl = hasBankConfig
    ? `https://img.vietqr.io/image/${bankName}-${accountNo}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(
        transferMemo,
      )}&accountName=${encodeURIComponent(accountName || "")}`
    : ""

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    void navigator.clipboard.writeText(text)
    setCopiedState(true)
    setTimeout(() => setCopiedState(false), 2000)
  }

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-md" className="p-6 sm:p-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <RefreshCw className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Gia hạn hội viên
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {membership.customer_name} &bull; {membership.phone}
          </p>
        </div>
      </div>

      {/* Package info card */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Gói dịch vụ:
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {packageName}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm border-t border-slate-200/60 pt-2 dark:border-slate-800">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Giá gói / Số tiền:
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {price > 0 ? `${formatVndInput(String(price))} VNĐ` : "0 VNĐ"}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="mt-8 flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-2 text-xs font-medium text-slate-400">Đang tải mã VietQR...</p>
        </div>
      ) : hasBankConfig ? (
        <div className="mt-5 flex flex-col items-center">
          {/* VietQR Image Container */}
          <div className="relative flex justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-white">
            <img
              src={vietQrUrl}
              alt={`Mã VietQR ${bankName}`}
              className="h-56 w-56 object-contain"
            />
          </div>

          <p className="mt-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để gia hạn
          </p>

          {/* Bank Transfer Details with Copy buttons */}
          <div className="mt-4 w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ngân hàng & STK:</span>
              <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                <span>
                  {bankName} - {accountNo} {accountName ? `(${accountName})` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(accountNo || "", setCopiedAccount)}
                  className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Sao chép số tài khoản"
                >
                  {copiedAccount ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-800">
              <span className="text-slate-500">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-1 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                <span>{transferMemo}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(transferMemo, setCopiedMemo)}
                  className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Sao chép nội dung chuyển khoản"
                >
                  {copiedMemo ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-amber-900 text-sm dark:text-amber-200">
            Chưa cài đặt Tài khoản Ngân hàng
          </h4>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            Vào mục <strong>Cài đặt &rarr; Thông tin Cửa hàng</strong> để điền số tài khoản ngân hàng của tiệm. Hệ thống sẽ tự động xuất mã VietQR để thu phí gia hạn!
          </p>
        </div>
      )}

      {/* Footer Action */}
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Đóng
        </button>
      </div>
    </Modal>
  )
}

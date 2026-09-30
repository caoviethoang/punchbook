import { useState } from "react"
import {
  Check,
  Copy,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react"
import type { Shop } from "../lib/auth"
import type { Membership } from "../lib/memberships"
import { formatVndInput } from "../lib/formatters"
import { Modal } from "./ui/Modal"

interface MembershipPaymentQRModalProps {
  isOpen: boolean
  membership: Membership | null
  packagePrice?: number | null
  shop?: Shop | null
  onClose: () => void
}

export function MembershipPaymentQRModal({
  isOpen,
  membership,
  packagePrice,
  shop,
  onClose,
}: MembershipPaymentQRModalProps) {
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)

  if (!isOpen || !membership) return null

  const bankName = shop?.bank_name
  const accountNo = shop?.bank_account_no
  const accountName = shop?.bank_account_name
  const price = packagePrice ?? membership.package.price ?? 0

  const hasBankConfig = Boolean(bankName && accountNo)

  const transferMemo = `PunchBook ${membership.customer_name} ${membership.phone}`

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
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Thanh toán Gói Hội Viên
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã QR chuyển khoản ngân hàng tự động (VietQR)
              </p>
            </div>
          </div>
        </div>

        {/* Member & Package Summary */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hội viên
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {membership.customer_name}{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({membership.phone})
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gói tập
              </p>
              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                {membership.package.name}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Số tiền thanh toán:
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatVndInput(String(price))} VNĐ
            </span>
          </div>
        </div>

        {/* QR Section */}
        {hasBankConfig ? (
          <div className="flex flex-col items-center">
            <div className="relative flex justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-white">
              <img
                src={vietQrUrl}
                alt={`Mã VietQR ${bankName}`}
                className="h-64 w-64 object-contain"
              />
            </div>

            <p className="mt-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển khoản tự động
            </p>

            {/* Quick Copy Info */}
            <div className="mt-4 w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngân hàng & STK:</span>
                <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                  <span>
                    {bankName} - {accountNo} ({accountName})
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
              <CreditCard className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Chưa cài đặt Tài khoản Ngân hàng
            </h4>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              Vào mục <strong>Cài đặt &rarr; Thông tin Cửa hàng</strong> để điền số tài khoản ngân hàng của tiệm. Hệ thống sẽ tự động xuất QR VietQR cho các lần thu phí hội viên!
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            Đã thêm hội viên thành công!
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Đóng &amp; Hoàn tất
          </button>
        </div>
      </div>
    </Modal>
  )
}

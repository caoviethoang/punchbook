import { useEffect, useState } from "react"
import { AlertCircle, Check, CheckCircle2, Copy, CreditCard, Loader2, QrCode, RefreshCw } from "lucide-react"
import { formatVndInput } from "../lib/formatters"
import { fetchSettings } from "../lib/settings"
import { renewMembership, type Membership, type RenewMembershipResult } from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"
import { toApiError } from "../lib/errors"
import type { Shop } from "../lib/auth"
import { Modal } from "./ui/Modal"

interface RenewalModalProps {
  membership: Membership
  onClose: () => void
  onSuccess?: (result: RenewMembershipResult) => void
  initialAutoCheckIn?: boolean
  staffId?: string
}

export function RenewalModal({
  membership,
  onClose,
  onSuccess,
  initialAutoCheckIn = true,
  staffId,
}: RenewalModalProps) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    membership.package?.id || "",
  )
  const [autoCheckIn, setAutoCheckIn] = useState<boolean>(initialAutoCheckIn)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      try {
        const [settingsRes, packagesRes] = await Promise.allSettled([
          fetchSettings(),
          listPackages(),
        ])

        if (isCancelled) return

        if (settingsRes.status === "fulfilled") {
          setShop(settingsRes.value.shop)
        }

        if (packagesRes.status === "fulfilled") {
          const list = packagesRes.value
          setPackages(list)
          if (!selectedPackageId && list.length > 0) {
            setSelectedPackageId(list[0].id)
          } else if (
            selectedPackageId &&
            !list.some((p) => p.id === selectedPackageId) &&
            list.length > 0
          ) {
            setSelectedPackageId(list[0].id)
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
  }, [selectedPackageId])

  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) ||
    (membership.package?.id === selectedPackageId
      ? (membership.package as PackageItem)
      : packages[0])

  const price = selectedPackage?.price ?? membership.package?.price ?? 0
  const packageName = selectedPackage?.name ?? membership.package?.name ?? "Gói tập"

  const bankName = shop?.bank_name
  const accountNo = shop?.bank_account_no
  const accountName = shop?.bank_account_name
  const hasBankConfig = Boolean(bankName && accountNo)

  const transferMemo = `Gia han ${membership.customer_name} ${membership.phone}`

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

  const handleConfirmRenew = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const result = await renewMembership(membership.id, {
        package_id: selectedPackageId || undefined,
        staff_id: staffId || undefined,
        auto_check_in: autoCheckIn,
      })

      if (onSuccess) {
        onSuccess(result)
      } else {
        onClose()
      }
    } catch (err) {
      setError(toApiError(err, "Không thể gia hạn hội viên. Vui lòng thử lại."))
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-lg" className="p-6 sm:p-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <RefreshCw className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Gia hạn hội viên</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {membership.customer_name} &bull; {membership.phone}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-2 text-xs font-medium text-slate-400">Đang tải thông tin gói tập...</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Package Selection */}
          <div>
            <label
              htmlFor="renewal-package-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
            >
              Chọn gói gia hạn
            </label>
            <select
              id="renewal-package-select"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {formatVndInput(String(pkg.price))} VNĐ (
                  {pkg.sessions_count ? `${pkg.sessions_count} buổi` : `${pkg.duration_days} ngày`})
                </option>
              ))}
            </select>
          </div>

          {/* Package info summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400">Gói áp dụng:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{packageName}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm border-t border-slate-200/60 pt-2 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Giá gói / Thu phí:
              </span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {price > 0 ? `${formatVndInput(String(price))} VNĐ` : "0 VNĐ"}
              </span>
            </div>
          </div>

          {/* Auto Check-in Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs font-medium text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
            <input
              type="checkbox"
              checked={autoCheckIn}
              onChange={(e) => setAutoCheckIn(e.target.checked)}
              className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 dark:border-indigo-800 dark:bg-slate-900"
            />
            <span>Tự động điểm danh (check-in) ngay sau khi gia hạn</span>
          </label>

          {/* VietQR Toggle button */}
          <div>
            <button
              type="button"
              onClick={() => setShowQrCode((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <QrCode className="h-4 w-4" />
              <span>{showQrCode ? "Ẩn mã QR chuyển khoản" : "Hiển thị mã VietQR chuyển khoản"}</span>
            </button>
          </div>

          {/* Collapsible VietQR Section */}
          {showQrCode && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {hasBankConfig ? (
                <div className="flex flex-col items-center">
                  <div className="relative flex justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <img
                      src={vietQrUrl}
                      alt={`Mã VietQR ${bankName}`}
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                  <div className="mt-3 w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">STK:</span>
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
                      <span className="text-slate-500">Nội dung CK:</span>
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
                  <CreditCard className="mx-auto mb-1 h-5 w-5 text-amber-600 dark:text-amber-300" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Cửa hàng chưa cài đặt tài khoản ngân hàng trong phần Cài đặt.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
        >
          Đóng
        </button>
        <button
          type="button"
          disabled={loading || submitting || !selectedPackageId}
          onClick={() => void handleConfirmRenew()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : autoCheckIn ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Gia hạn & Check-in ngay</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Xác nhận gia hạn</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}

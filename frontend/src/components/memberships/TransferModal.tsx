import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Phone,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatVnd, formatVndInput, remainingLabel } from "../../lib/formatters"
import { toApiError } from "../../lib/errors"
import {
  isMembershipExhausted,
  transferMembership,
  type Membership,
  type TransferMembershipResult,
} from "../../lib/memberships"
import { Modal } from "../ui/Modal"

interface TransferModalProps {
  membership: Membership
  onClose: () => void
  onSuccess?: (result: TransferMembershipResult) => void
  staffId?: string
}

export function TransferModal({
  membership,
  onClose,
  onSuccess,
  staffId,
}: TransferModalProps) {
  const { t } = useTranslation()

  const [targetCustomerName, setTargetCustomerName] = useState("")
  const [targetPhone, setTargetPhone] = useState("")
  const [transferFeeStr, setTransferFeeStr] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<TransferMembershipResult | null>(null)

  const isExhausted = isMembershipExhausted(membership)
  const isAlreadyTransferred = membership.is_transferred || membership.status === "transferred"

  const parseFee = (): number => {
    const raw = transferFeeStr.replace(/\D/g, "")
    return raw ? parseInt(raw, 10) : 0
  }

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferFeeStr(formatVndInput(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const name = targetCustomerName.trim()
    const phone = targetPhone.trim()

    if (!name) {
      setError(t("memberships.transfer_err_name_required", "Vui lòng nhập họ và tên người nhận."))
      return
    }

    if (!phone) {
      setError(t("memberships.transfer_err_phone_required", "Vui lòng nhập số điện thoại người nhận."))
      return
    }

    if (phone === membership.phone.trim()) {
      setError(
        t(
          "memberships.transfer_err_self_transfer",
          "Không thể chuyển nhượng cho chính số điện thoại của hội viên này.",
        ),
      )
      return
    }

    try {
      setSubmitting(true)
      const fee = parseFee()
      const result = await transferMembership(membership.id, {
        target_customer_name: name,
        target_phone: phone,
        staff_id: staffId,
        transfer_fee: fee,
        note: note.trim() || undefined,
      })
      setSuccessResult(result)
      onSuccess?.(result)
    } catch (err) {
      setError(toApiError(err, t("memberships.transfer_failed", "Chuyển nhượng thẻ tập thất bại.")))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("memberships.transfer_modal_title", "Chuyển nhượng thẻ tập")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "memberships.transfer_modal_desc",
                "Chuyển toàn bộ số buổi hoặc ngày còn lại sang hội viên khác",
              )}
            </p>
          </div>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="mt-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t("memberships.transfer_success_title", "Chuyển nhượng thành công!")}
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "memberships.transfer_success_desc",
                  "Thẻ tập đã được chuyển sang cho {{name}} ({{phone}}).",
                  {
                    name: successResult.target_membership.customer_name,
                    phone: successResult.target_membership.phone,
                  },
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-xs space-y-2 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex justify-between">
                <span className="text-slate-500">Người chuyển:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {membership.customer_name} ({membership.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người nhận:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {successResult.target_membership.customer_name} (
                  {successResult.target_membership.phone})
                </span>
              </div>
              {successResult.transfer.sessions_transferred !== null &&
                successResult.transfer.sessions_transferred !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số buổi chuyển giao:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {successResult.transfer.sessions_transferred} buổi
                    </span>
                  </div>
                )}
              {successResult.transfer.days_transferred !== null &&
                successResult.transfer.days_transferred !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số ngày chuyển giao:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {successResult.transfer.days_transferred} ngày
                    </span>
                  </div>
                )}
              {successResult.transfer.fee > 0 && (
                <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                  <span className="text-slate-500">Phí chuyển nhượng:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatVnd(successResult.transfer.fee)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
              >
                {t("common.close", "Đóng")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
            {/* Source Member Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t("memberships.transfer_source_info", "Thông tin thẻ chuyển đi")}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {membership.customer_name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{membership.phone}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {membership.package.name}
                  </span>
                  <div className="mt-1 font-bold text-slate-700 dark:text-slate-300">
                    {remainingLabel(membership)}
                  </div>
                </div>
              </div>
            </div>

            {/* Ineligible Warnings */}
            {isAlreadyTransferred ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {t(
                    "memberships.transfer_already_transferred",
                    "Thẻ tập này đã được chuyển nhượng trước đó và không thể chuyển tiếp.",
                  )}
                </span>
              </div>
            ) : isExhausted ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {t(
                    "memberships.transfer_exhausted_notice",
                    "Thẻ tập đã hết hạn hoặc hết số buổi còn lại, không còn giá trị để chuyển nhượng.",
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  {t(
                    "memberships.transfer_warning",
                    "Lưu ý: Sau khi chuyển nhượng, thẻ hiện tại của hội viên này sẽ bị vô hiệu hóa (về 0 buổi / hết hạn) và chuyển trạng thái Đã chuyển nhượng.",
                  )}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Customer Name */}
            <div>
              <label
                htmlFor="targetCustomerName"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("memberships.transfer_target_name", "Tên hội viên nhận")} *
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="targetCustomerName"
                  type="text"
                  required
                  disabled={isAlreadyTransferred || isExhausted || submitting}
                  value={targetCustomerName}
                  onChange={(e) => setTargetCustomerName(e.target.value)}
                  placeholder={t(
                    "memberships.transfer_target_name_placeholder",
                    "VD: Nguyễn Văn A",
                  )}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Target Customer Phone */}
            <div>
              <label
                htmlFor="targetPhone"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("memberships.transfer_target_phone", "Số điện thoại người nhận")} *
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="targetPhone"
                  type="tel"
                  required
                  disabled={isAlreadyTransferred || isExhausted || submitting}
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="0987654321"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t(
                  "memberships.transfer_target_phone_hint",
                  "Nếu người nhận đã có thẻ cùng gói, số dư sẽ được cộng dồn gia hạn.",
                )}
              </p>
            </div>

            {/* Transfer Fee */}
            <div>
              <label
                htmlFor="transferFee"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("memberships.transfer_fee", "Phí chuyển nhượng (VNĐ)")}
              </label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="transferFee"
                  type="text"
                  disabled={isAlreadyTransferred || isExhausted || submitting}
                  value={transferFeeStr}
                  onChange={handleFeeChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t(
                  "memberships.transfer_fee_hint",
                  "Để trống hoặc nhập 0 nếu miễn phí chuyển nhượng.",
                )}
              </p>
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="transferNote"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("memberships.transfer_note", "Ghi chú")}
              </label>
              <textarea
                id="transferNote"
                rows={2}
                disabled={isAlreadyTransferred || isExhausted || submitting}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(
                  "memberships.transfer_note_placeholder",
                  "Lý do chuyển nhượng hoặc ghi chú thêm...",
                )}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("common.cancel", "Hủy")}
              </button>
              <button
                type="submit"
                disabled={isAlreadyTransferred || isExhausted || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("common.processing", "Đang xử lý...")}</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>{t("memberships.btn_transfer", "Xác nhận chuyển")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

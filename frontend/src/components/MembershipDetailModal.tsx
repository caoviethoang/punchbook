import { AlertCircle, Loader2, Receipt, UserCheck } from "lucide-react"
import { useMembershipDetail } from "../hooks/useMembershipDetail"
import { CheckInHistoryTab } from "./membership-detail/CheckInHistoryTab"
import { InvoiceHistoryTab } from "./membership-detail/InvoiceHistoryTab"
import { MembershipDetailHeader } from "./membership-detail/MembershipDetailHeader"
import { Modal } from "./ui/Modal"
import { ThermalReceiptModal } from "./ThermalReceiptModal"

interface MembershipDetailModalProps {
  membershipId: string
  onClose: () => void
}

export function MembershipDetailModal({
  membershipId,
  onClose,
}: MembershipDetailModalProps) {
  const {
    detail,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedReceipt,
    setSelectedReceipt,
    handlePrintReceipt,
  } = useMembershipDetail(membershipId)

  const tabClass = (tab: "check_ins" | "invoices") =>
    `flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
    }`

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex max-h-[90vh] flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 p-6 dark:border-slate-800 sm:p-7">
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                Đang tải thông tin chi tiết hội viên...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          ) : detail ? (
            <MembershipDetailHeader detail={detail} />
          ) : null}
        </div>

        {/* Tabs */}
        {!loading && !error && detail && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 dark:border-slate-800 dark:bg-slate-950/40">
              <button type="button" onClick={() => setActiveTab("check_ins")} className={tabClass("check_ins")}>
                <UserCheck className="h-4 w-4" />
                <span>Lịch sử Check-in</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {detail.check_ins.length}
                </span>
              </button>

              <button type="button" onClick={() => setActiveTab("invoices")} className={tabClass("invoices")}>
                <Receipt className="h-4 w-4" />
                <span>Lịch sử Thanh toán</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {detail.invoices.length}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "check_ins" ? (
                <CheckInHistoryTab
                  checkIns={detail.check_ins}
                  onPrintReceipt={handlePrintReceipt}
                />
              ) : (
                <InvoiceHistoryTab invoices={detail.invoices} />
              )}
            </div>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ThermalReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </Modal>
  )
}

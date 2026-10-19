import { AlertCircle, Loader2, User, Users } from "lucide-react"
import { useCheckInScreen } from "../hooks/useCheckInScreen"
import { CheckInHeader } from "./checkin/CheckInHeader"
import { CheckInSearchInput } from "./checkin/CheckInSearchInput"
import { MembershipResultList } from "./checkin/CheckInSearchResults"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { QRScannerModal } from "./QRScannerModal"
import { RenewalModal } from "./RenewalModal"
import { ThermalReceiptModal } from "./ThermalReceiptModal"
import type { Staff } from "../lib/auth"
import { Toast } from "./ui/Toast"
import { cn } from "../lib/utils"

interface CheckInScreenProps {
  /** Optional active staff object. */
  currentStaff?: Staff | null
  /** Optional staff ID to perform check-ins. */
  currentStaffId?: string
  shopName?: string
  shopAddress?: string | null
  shopPhone?: string | null
}

export function CheckInScreen({
  currentStaff,
  currentStaffId,
  shopName = "PunchBook Spa",
  shopAddress,
  shopPhone,
}: CheckInScreenProps) {
  const {
    query,
    setQuery,
    memberships,
    checkingInId,
    checkInMessage,
    toast,
    setToast,
    isQRScannerOpen,
    setIsQRScannerOpen,
    selectedReceipt,
    setSelectedReceipt,
    inputRef,
    detailMembershipId,
    setDetailMembershipId,
    renewingMembership,
    setRenewingMembership,
    isLoading,
    apiError,
    handleClear,
    handleKeyDown,
    handleCheckIn,
    handleQRScan,
    handlePrintReceipt,
    staffs,
    loadingStaffs,
    selectedStaffId,
    setSelectedStaffId,
    refreshMemberships,
  } = useCheckInScreen({
    currentStaff,
    currentStaffId,
    shopName,
    shopAddress,
    shopPhone,
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <CheckInHeader
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentStaff={currentStaff}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onSelectStaff={setSelectedStaffId}
        loadingStaffs={loadingStaffs}
      />

      {/* Search Input Box */}
      <CheckInSearchInput
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {/* API Error Alert */}
      {apiError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Results Section */}
      {isLoading && memberships.length === 0 ? (
        <div
          role="status"
          aria-label="Đang tải danh sách hội viên"
          className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Đang tải danh sách hội viên...
          </h3>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      ) : memberships.length === 0 ? (
        query.trim() === "" ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Chưa có hội viên nào trong hệ thống
            </h3>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Các hội viên đăng ký gói tập sẽ xuất hiện tại đây để điểm danh nhanh.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy hội viên phù hợp
            </h3>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Không có kết quả nào cho từ khóa &ldquo;
              <span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>
              &rdquo;. Vui lòng kiểm tra lại thông tin.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {query.trim() ? "Kết quả tìm kiếm" : "Danh sách hội viên"}
            </h2>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                query.trim()
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {memberships.length} {query.trim() ? "kết quả" : "hội viên"}
            </span>
          </div>

          <MembershipResultList
            memberships={memberships}
            checkingInId={checkingInId}
            checkInMessage={checkInMessage}
            onCheckIn={(id) => void handleCheckIn(id)}
            onRenew={(m) => setRenewingMembership(m)}
            onViewDetail={(id) => setDetailMembershipId(id)}
            onPrintReceipt={handlePrintReceipt}
          />
        </div>
      )}

      {/* Membership Detail & History Modal */}
      {detailMembershipId && (
        <MembershipDetailModal
          membershipId={detailMembershipId}
          onClose={() => setDetailMembershipId(null)}
        />
      )}

      {/* Renewal Modal */}
      {renewingMembership && (
        <RenewalModal
          membership={renewingMembership}
          onClose={() => {
            setRenewingMembership(null)
            void refreshMemberships()
          }}
        />
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  )
}

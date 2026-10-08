import { ShieldAlert } from "lucide-react"
import type { Shop, Staff } from "../lib/auth"
import { useShopSettings } from "../hooks/useShopSettings"
import { SecuritySection } from "./settings/SecuritySection"
import { ShopProfileSection } from "./settings/ShopProfileSection"
import { SubscriptionSection } from "./settings/SubscriptionSection"
import { StaffManagementSection } from "./StaffManagementSection"
import { Toast } from "./ui/Toast"
import { UpgradePlanModal } from "./UpgradePlanModal"

interface SettingsScreenProps {
  shop: Shop
  currentStaff?: Staff | null
  onShopUpdated: (updatedShop: Shop) => void
}

export function SettingsScreen({ shop, currentStaff, onShopUpdated }: SettingsScreenProps) {
  const isAdmin = !currentStaff || currentStaff.role === "admin"

  const {
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
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordLoading,
    showUpgradeModal,
    setShowUpgradeModal,
    daysLeft,
    showRenewalButton,
    toast,
    setToast,
    handleToast,
    handleProfileSubmit,
    handlePasswordSubmit,
  } = useShopSettings({
    shop,
    isAdmin,
    onShopUpdated,
  })

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

      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Chế độ chỉ xem (Dành cho Lễ tân)</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              Tài khoản của bạn không có quyền chỉnh sửa thông tin cửa hàng, đổi mật khẩu hoặc quản lý nhân viên.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: Store Information */}
        <ShopProfileSection
          isAdmin={isAdmin}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          address={address}
          setAddress={setAddress}
          bankName={bankName}
          setBankName={setBankName}
          bankAccountNo={bankAccountNo}
          setBankAccountNo={setBankAccountNo}
          bankAccountName={bankAccountName}
          setBankAccountName={setBankAccountName}
          profileLoading={profileLoading}
          onSubmit={handleProfileSubmit}
        />

        {/* Section 2: Password Change */}
        <SecuritySection
          isAdmin={isAdmin}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordLoading={passwordLoading}
          onSubmit={handlePasswordSubmit}
        />
      </div>

      {/* Section 2.5: Staff Management for Shop Admin */}
      <StaffManagementSection
        currentStaff={currentStaff}
        onToast={handleToast}
      />

      {/* Section 3: Subscription Plan Info & Upgrade CTA */}
      <SubscriptionSection
        shop={shop}
        isAdmin={isAdmin}
        daysLeft={daysLeft}
        showRenewalButton={showRenewalButton}
        onOpenUpgradeModal={() => setShowUpgradeModal(true)}
      />

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

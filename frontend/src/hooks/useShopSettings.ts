import { useState, useCallback, type FormEvent } from "react"
import type { Shop } from "../lib/auth"
import { toApiError } from "../lib/errors"
import { changeShopPassword, updateShopProfile } from "../lib/settings"

interface UseShopSettingsProps {
  shop: Shop
  isAdmin: boolean
  onShopUpdated: (updatedShop: Shop) => void
}

export function useShopSettings({ shop, isAdmin, onShopUpdated }: UseShopSettingsProps) {
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

  const [daysLeft] = useState(() => {
    if (!shop.plan_expires_at) return 0
    return Math.ceil((new Date(shop.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  })

  const showRenewalButton = shop.plan !== "paid" || daysLeft <= 10

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type })
  }, [])

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
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
    if (!isAdmin) return

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

  return {
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
  }
}

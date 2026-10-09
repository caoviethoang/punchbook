import { useEffect, useState } from "react"
import { getMembershipDetail, type MembershipDetail } from "../lib/memberships"
import type { ReceiptData } from "../components/ThermalReceiptModal"

export function useMembershipDetail(membershipId: string) {
  const [detail, setDetail] = useState<MembershipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"check_ins" | "invoices">("check_ins")
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)

  useEffect(() => {
    let isCancelled = false

    getMembershipDetail(membershipId)
      .then((data) => {
        if (!isCancelled) {
          setDetail(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải thông tin chi tiết hội viên.",
          )
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [membershipId])

  function handlePrintReceipt(checkedInAt: string, staffName?: string | null) {
    if (!detail) return
    setSelectedReceipt({
      shopName: "PunchBook Spa",
      customerName: detail.customer_name,
      customerPhone: detail.phone,
      packageName: detail.package.name,
      sessionsLeft: detail.sessions_left,
      expiresAt: detail.expires_at,
      checkedInAt,
      staffName,
    })
  }

  return {
    detail,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedReceipt,
    setSelectedReceipt,
    handlePrintReceipt,
  }
}

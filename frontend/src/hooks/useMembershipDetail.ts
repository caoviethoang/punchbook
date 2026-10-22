import { useEffect, useState } from "react"
import { getMembershipDetail, updateMembership, type MembershipDetail } from "../lib/memberships"
import type { ReceiptData } from "../components/ThermalReceiptModal"

export type MembershipDetailTab = "card" | "check_ins" | "invoices"

export function useMembershipDetail(
  membershipId: string,
  initialTab: MembershipDetailTab = "card",
) {
  const [detail, setDetail] = useState<MembershipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MembershipDetailTab>(initialTab)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [updatingNotes, setUpdatingNotes] = useState(false)

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
            err instanceof Error ? err.message : "Không thể tải thông tin chi tiết hội viên.",
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
      shopName: detail.shop?.name || "PunchBook Spa",
      shopAddress: detail.shop?.address,
      shopPhone: detail.shop?.phone,
      customerName: detail.customer_name,
      customerPhone: detail.phone,
      packageName: detail.package.name,
      sessionsLeft: detail.sessions_left,
      expiresAt: detail.expires_at,
      checkedInAt,
      staffName,
    })
  }

  async function handleUpdateNotes(newNotes: string) {
    setUpdatingNotes(true)
    try {
      const updated = await updateMembership(membershipId, { notes: newNotes })
      setDetail((prev) => (prev ? { ...prev, notes: updated.notes ?? newNotes } : null))
      return updated
    } finally {
      setUpdatingNotes(false)
    }
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
    handleUpdateNotes,
    updatingNotes,
  }
}

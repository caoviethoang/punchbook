import { useEffect, useState } from "react"
import { apiGet } from "../lib/api"
import { toApiError } from "../lib/errors"

export interface AuditLogEntry {
  id: string
  action: string
  staff_name: string | null
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  check_in: { label: "Check-in", icon: "✓" },
  membership_created: { label: "Thêm hội viên", icon: "+" },
  membership_renewed: { label: "Gia hạn hội viên", icon: "↺" },
  shop_plan_upgraded: { label: "Nâng cấp gói shop", icon: "⭐" },
  membership_renewal_needed: { label: "Cảnh báo gia hạn", icon: "⚠️" },
}

export function useAuditLogs(shopId: string) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("")

  const handleFilterChange = (f: string) => {
    setFilter(f)
    setLoading(true)
  }

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (shopId) params.set("shop_id", shopId)
    if (filter) params.set("log_action", filter)

    const queryString = params.toString()
    const path = queryString ? `/audit_logs?${queryString}` : "/audit_logs"

    apiGet<{ audit_logs: AuditLogEntry[] }>(path)
      .then((data) => {
        if (!active) return
        setLogs(data.audit_logs || [])
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(toApiError(err, "Lỗi tải nhật ký thao tác"))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [shopId, filter])

  return {
    logs,
    loading,
    error,
    filter,
    handleFilterChange,
  }
}

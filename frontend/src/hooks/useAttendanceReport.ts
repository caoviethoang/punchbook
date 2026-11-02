import { useCallback, useEffect, useMemo, useState } from "react"
import {
  downloadAttendanceExcelReport,
  getAttendanceReport,
  type AttendanceRecord,
  type AttendanceReportResponse,
} from "../lib/attendance"
import { toApiError } from "../lib/errors"

export type AttendanceFilterTab = "all" | "active" | "inactive"

function getCurrentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function useAttendanceReport(initialMonth = getCurrentYearMonth()) {
  const [month, setMonth] = useState<string>(initialMonth)
  const [data, setData] = useState<AttendanceReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [filterTab, setFilterTab] = useState<AttendanceFilterTab>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchReport = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getAttendanceReport(month)
        if (!active) return
        setData(response)
      } catch (err) {
        if (!active) return
        setError(toApiError(err, "Không thể tải báo cáo chuyên cần."))
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchReport()

    return () => {
      active = false
    }
  }, [month, refreshKey])

  const loadReport = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const prevMonth = useCallback(() => {
    setMonth((current) => {
      const [y, m] = current.split("-").map(Number)
      if (!y || !m) return getCurrentYearMonth()
      const d = new Date(y, m - 2, 1)
      const prevY = d.getFullYear()
      const prevM = String(d.getMonth() + 1).padStart(2, "0")
      return `${prevY}-${prevM}`
    })
  }, [])

  const nextMonth = useCallback(() => {
    setMonth((current) => {
      const [y, m] = current.split("-").map(Number)
      if (!y || !m) return getCurrentYearMonth()
      const d = new Date(y, m, 1)
      const nextY = d.getFullYear()
      const nextM = String(d.getMonth() + 1).padStart(2, "0")
      return `${nextY}-${nextM}`
    })
  }, [])

  const handleExport = useCallback(async () => {
    try {
      setExporting(true)
      setExportError(null)
      await downloadAttendanceExcelReport(month)
    } catch (err) {
      const msg = toApiError(err, "Xuất báo cáo chuyên cần thất bại.")
      setExportError(msg)
      throw err
    } finally {
      setExporting(false)
    }
  }, [month])

  const attendance = data?.attendance

  const filteredRecords = useMemo((): AttendanceRecord[] => {
    const list = attendance ?? []
    const q = searchQuery.trim().toLowerCase()
    return list.filter((record) => {
      if (filterTab === "active" && record.is_inactive) return false
      if (filterTab === "inactive" && !record.is_inactive) return false

      if (!q) return true
      const nameMatch = record.customer_name.toLowerCase().includes(q)
      const phoneMatch = record.phone.includes(q)
      const pkgMatch = record.package_name.toLowerCase().includes(q)
      return nameMatch || phoneMatch || pkgMatch
    })
  }, [attendance, filterTab, searchQuery])

  return {
    month,
    setMonth,
    data,
    loading,
    error,
    exporting,
    exportError,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    filteredRecords,
    loadReport,
    prevMonth,
    nextMonth,
    handleExport,
  }
}

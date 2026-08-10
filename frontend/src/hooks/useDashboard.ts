import { useCallback, useState } from "react"
import { fetchDashboard, type DashboardData } from "../lib/dashboard"

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dashboard = await fetchDashboard()
      setData(dashboard)
      return dashboard
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, load }
}

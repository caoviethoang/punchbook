import { useState } from "react"
import {
  checkIn as checkInRequest,
  searchMemberships,
  type CheckInResult,
  type Membership,
} from "../lib/memberships"

/** Thin UI-layer wrappers around memberships REST helpers. */
export function useMembershipsApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search(query: string): Promise<Membership[]> {
    setLoading(true)
    setError(null)
    try {
      return await searchMemberships(query)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function checkIn(id: string, staffId: string): Promise<CheckInResult> {
    setLoading(true)
    setError(null)
    try {
      return await checkInRequest(id, staffId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { search, checkIn, loading, error }
}

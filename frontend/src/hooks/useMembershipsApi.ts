import { useCallback, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  checkIn as checkInRequest,
  searchMemberships,
  type CheckInResult,
  type Membership,
} from "../lib/memberships"

/** Thin UI-layer wrappers around memberships REST helpers. */
export function useMembershipsApi() {
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string): Promise<Membership[]> => {
    setSearchLoading(true)
    setError(null)
    try {
      return await searchMemberships(query)
    } catch (err) {
      const message = toApiError(err, "Tìm kiếm hội viên thất bại.")
      setError(message)
      throw err
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const checkIn = useCallback(
    async (id: string, staffId: string): Promise<CheckInResult> => {
      setError(null)
      try {
        return await checkInRequest(id, staffId)
      } catch (err) {
        const message = toApiError(err, "Check-in thất bại.")
        setError(message)
        throw err
      }
    },
    [],
  )

  return { search, checkIn, searchLoading, error }
}

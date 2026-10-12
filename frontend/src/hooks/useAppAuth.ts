import { useEffect, useState } from "react"
import {
  clearStoredToken,
  fetchCurrentAuth,
  getStoredToken,
  type Shop,
  type Staff,
} from "../lib/auth"

export function useAppAuth() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [authLoading, setAuthLoading] = useState(() => getStoredToken() !== null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    fetchCurrentAuth(token)
      .then(({ shop: s, staff: st }) => {
        setShop(s)
        setStaff(st)
      })
      .catch(() => clearStoredToken())
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (shop?.name) {
      document.title = `${shop.name} - PunchBook`
    } else {
      document.title = "PunchBook"
    }
  }, [shop?.name])

  function handleLogout() {
    clearStoredToken()
    setShop(null)
    setStaff(null)
  }

  function handleAuthSuccess(s: Shop, st?: Staff | null) {
    setShop(s)
    if (st !== undefined) setStaff(st)
  }

  return {
    shop,
    setShop,
    staff,
    authLoading,
    handleLogout,
    handleAuthSuccess,
  }
}

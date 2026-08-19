import { useEffect, useState } from "react"
import { CheckInScreen } from "./components/CheckInScreen"
import { DashboardScreen } from "./components/DashboardScreen"
import { LoginScreen } from "./components/LoginScreen"
import { MembershipCreateForm } from "./components/MembershipCreateForm"
import { PackageCreateForm } from "./components/PackageCreateForm"
import {
  clearStoredToken,
  fetchCurrentShop,
  getStoredToken,
  type Shop,
} from "./lib/auth"

type AppView = "dashboard" | "checkin" | "packages" | "members"

const NAV_ITEMS: { view: AppView; label: string }[] = [
  { view: "dashboard", label: "Dashboard" },
  { view: "checkin", label: "Check-in" },
  { view: "members", label: "Hội viên" },
  { view: "packages", label: "Gói dịch vụ" },
]

function App() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [authLoading, setAuthLoading] = useState(() => getStoredToken() !== null)
  const [view, setView] = useState<AppView>("dashboard")

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    fetchCurrentShop(token)
      .then(setShop)
      .catch(() => clearStoredToken())
      .finally(() => setAuthLoading(false))
  }, [])

  function handleLogout() {
    clearStoredToken()
    setShop(null)
    setView("dashboard")
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <LoginScreen onSuccess={setShop} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              PunchBook
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {shop.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            <nav className="flex flex-wrap rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              {NAV_ITEMS.map(({ view: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                    view === v
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <span>
              Plan:{" "}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {shop.plan}
              </strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === "dashboard" ? (
          <DashboardScreen />
        ) : view === "checkin" ? (
          <CheckInScreen />
        ) : view === "members" ? (
          <div className="flex justify-center">
            <MembershipCreateForm />
          </div>
        ) : (
          <div className="flex justify-center">
            <PackageCreateForm />
          </div>
        )}
      </main>
    </div>
  )
}

export default App

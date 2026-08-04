import { useEffect, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { gql } from "@apollo/client/core"
import { CheckInScreen } from "./components/CheckInScreen"
import { LoginScreen } from "./components/LoginScreen"
import {
  clearStoredToken,
  fetchCurrentShop,
  getStoredToken,
  type Shop,
} from "./lib/auth"

const HELLO_QUERY = gql`
  query GetHello {
    hello {
      message
    }
  }
`

interface HelloData {
  hello: {
    message: string
  }
}

function App() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [authLoading, setAuthLoading] = useState(() => getStoredToken() !== null)

  const { data } = useQuery<HelloData>(HELLO_QUERY, {
    skip: !shop,
  })

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
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              PunchBook
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {shop.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>
              Plan: <strong className="font-semibold text-slate-700 dark:text-slate-200">{shop.plan}</strong>
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

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl py-6">
        {/* GraphQL Hello Badge */}
        {data?.hello?.message && (
          <div className="mx-4 mb-6 rounded-xl bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:mx-6">
            System status: {data.hello.message}
          </div>
        )}

        {/* CheckIn Screen */}
        <CheckInScreen />
      </main>
    </div>
  )
}

export default App


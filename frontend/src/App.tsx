import { useEffect, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { gql } from "@apollo/client/core"
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

  const { loading, error, data } = useQuery<HelloData>(HELLO_QUERY, {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 dark:shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              PunchBook
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {shop.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            Sign out
          </button>
        </div>

        <div className="flex h-24 items-center justify-center rounded-xl bg-slate-100 p-4 text-center font-semibold dark:bg-slate-800">
          {loading && (
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading...</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500">
              Error fetching: {error.message}
            </p>
          )}
          {data && (
            <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
              {data.hello.message}
            </p>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Plan: {shop.plan} · {shop.email}
        </div>
      </div>
    </div>
  )
}

export default App

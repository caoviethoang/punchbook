import { useQuery } from "@apollo/client/react"
import { gql } from "@apollo/client/core"


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
  const { loading, error, data } = useQuery<HelloData>(HELLO_QUERY)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 dark:shadow-2xl">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
          PunchBook
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Digital Membership Management
        </p>

        <div className="flex h-24 items-center justify-center rounded-xl bg-slate-100 p-4 text-center font-semibold dark:bg-slate-800">
          {loading && (
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading...</span>
            </div>
          )}
          {error && (
            <p className="text-red-500 text-sm">
              Error fetching: {error.message}
            </p>
          )}
          {data && (
            <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">
              {data.hello.message}
            </p>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
          Vite + React + Apollo Client + Rails 8 API
        </div>
      </div>
    </div>
  )
}

export default App

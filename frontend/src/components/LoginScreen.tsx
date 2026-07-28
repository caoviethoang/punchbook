import { useState, type InputHTMLAttributes } from "react"
import { login, register, setStoredToken, type Shop } from "../lib/auth"

type Mode = "login" | "register"

interface LoginScreenProps {
  onSuccess: (shop: Shop) => void
}

const labelClass =
  "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"

function Field({
  label,
  ...inputProps
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} {...inputProps} />
    </label>
  )
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result =
        mode === "login"
          ? await login(email, password)
          : await register({
              name,
              phone,
              email,
              password,
              password_confirmation: password,
            })

      setStoredToken(result.token)
      onSuccess(result.shop)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 dark:shadow-2xl">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
        PunchBook
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {mode === "login" ? "Sign in to your shop" : "Create your shop account"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <Field
              label="Shop name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              label="Phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Field
          label="Password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login")
          setError(null)
        }}
        className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        {mode === "login"
          ? "New shop? Create an account"
          : "Already have an account? Sign in"}
      </button>

      {mode === "login" && (
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo seed: studio1@punchbook.test / password123
        </p>
      )}
    </div>
  )
}

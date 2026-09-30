import { useState } from "react"
import { login, register, setStoredToken, type Shop, type Staff } from "../lib/auth"
import { FormField } from "./ui/FormField"

type Mode = "login" | "register"
type LoginType = "owner" | "staff"

interface LoginScreenProps {
  onSuccess: (shop: Shop, staff?: Staff | null) => void
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login")
  const [loginType, setLoginType] = useState<LoginType>("owner")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const loginIdentifier = loginType === "owner" ? email : username
      const result =
        mode === "login"
          ? await login(loginIdentifier, password)
          : await register({
              name,
              phone,
              email,
              password,
              password_confirmation: password,
            })

      setStoredToken(result.token)
      onSuccess(result.shop, result.staff)
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
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {mode === "login"
          ? loginType === "owner"
            ? "Đăng nhập tài khoản Chủ shop"
            : "Đăng nhập tài khoản Nhân viên / Lễ tân"
          : "Đăng ký tài khoản phòng tập mới"}
      </p>

      {mode === "login" && (
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setLoginType("owner")
              setError(null)
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              loginType === "owner"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Chủ Shop (Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("staff")
              setError(null)
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              loginType === "staff"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Lễ tân / Nhân viên
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <FormField
              label="Tên cửa hàng / Phòng tập"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Sài Gòn Gym"
            />
            <FormField
              label="Số điện thoại"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901234567"
            />
          </>
        )}

        {mode === "register" || loginType === "owner" ? (
          <FormField
            label="Email tài khoản Chủ shop"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chushop@gmail.com"
          />
        ) : (
          <FormField
            label="Tên đăng nhập Nhân viên"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="letan_1"
          />
        )}

        <FormField
          label="Mật khẩu"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
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
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký Cửa hàng"}
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
        {mode === "login" ? "Phòng tập mới? Tạo tài khoản mới" : "Đã có tài khoản? Đăng nhập ngay"}
      </button>

      {mode === "login" && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Tài khoản mẫu (Demo Seed):</p>
          <p className="mt-1">🔑 Chủ shop: <code className="font-mono text-indigo-600 dark:text-indigo-400">studio1@punchbook.test</code> / <code className="font-mono">password123</code></p>
          <p className="mt-0.5">🔑 Lễ tân: <code className="font-mono text-indigo-600 dark:text-indigo-400">letan_studio1</code> / <code className="font-mono">password123</code></p>
        </div>
      )}
    </div>
  )
}

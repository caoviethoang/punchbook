import { Check, Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "../../hooks/useTheme"

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const options: {
    key: Theme
    title: string
    description: string
    icon: typeof Sun
  }[] = [
    {
      key: "light",
      title: "Chế độ Sáng",
      description: "Giao diện sáng tiêu chuẩn, phù hợp làm việc ban ngày.",
      icon: Sun,
    },
    {
      key: "dark",
      title: "Chế độ Tối",
      description: "Giao diện nền tối dịu mắt, giảm mỏi mắt ban đêm.",
      icon: Moon,
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Giao diện Hiển thị</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tùy chỉnh giao diện Sáng hoặc Tối độc lập theo nhu cầu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map(({ key, title, description, icon: Icon }) => {
          const isSelected = theme === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

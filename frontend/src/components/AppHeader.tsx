import type { Shop, Staff } from "../lib/auth"
import { ThemeToggle } from "./ui/ThemeToggle"

export type AppView = "dashboard" | "checkin" | "packages" | "members" | "settings"

interface NavItem {
  view: AppView
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", adminOnly: true },
  { view: "checkin", label: "Check-in" },
  { view: "members", label: "Hội viên" },
  { view: "packages", label: "Gói dịch vụ", adminOnly: true },
  { view: "settings", label: "Cài đặt", adminOnly: true },
]

interface AppHeaderProps {
  shop: Shop
  staff: Staff | null
  activeView: AppView
  onSelectView: (view: AppView) => void
  onLogout: () => void
}

export function AppHeader({
  shop,
  staff,
  activeView,
  onSelectView,
  onLogout,
}: AppHeaderProps) {
  const isAdmin = !staff || staff.role === "admin"
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-xl font-extrabold tracking-tight text-indigo-600 sm:text-2xl dark:text-indigo-400">
            {shop.name}
          </h1>
          {staff && (
            <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {staff.role === "admin" ? "Admin" : "Lễ tân"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:gap-2.5 sm:text-sm md:justify-end md:gap-3 dark:text-slate-400">
          <nav className="flex items-center rounded-xl border border-slate-200 p-0.5 sm:p-1 dark:border-slate-700">
            {visibleNavItems.map(({ view: v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => onSelectView(v)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold transition sm:px-3 sm:py-1.5 ${
                  activeView === v
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <span className="shrink-0 whitespace-nowrap">
            Plan:{" "}
            <strong
              className={`font-bold ${
                shop.plan === "paid"
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {shop.plan_details || (shop.plan === "paid" ? "Premium" : "Free")}
            </strong>
          </span>
          <ThemeToggle className="shrink-0" />
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 sm:px-3 sm:py-1.5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

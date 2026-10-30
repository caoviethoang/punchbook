import { useTranslation } from "react-i18next"
import type { Shop, Staff } from "../lib/auth"
import { LanguageToggle } from "./ui/LanguageToggle"
import { ThemeToggle } from "./ui/ThemeToggle"

export type AppView = "dashboard" | "checkin" | "packages" | "members" | "settings"

interface NavItemConfig {
  view: AppView
  labelKey: string
  defaultLabel: string
  adminOnly?: boolean
}

const NAV_ITEMS_CONFIG: NavItemConfig[] = [
  { view: "dashboard", labelKey: "nav.dashboard", defaultLabel: "Dashboard", adminOnly: true },
  { view: "checkin", labelKey: "nav.checkin", defaultLabel: "Check-in" },
  { view: "members", labelKey: "nav.members", defaultLabel: "Hội viên" },
  { view: "packages", labelKey: "nav.packages", defaultLabel: "Gói dịch vụ", adminOnly: true },
  { view: "settings", labelKey: "nav.settings", defaultLabel: "Cài đặt", adminOnly: true },
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
  const { t } = useTranslation()
  const isAdmin = !staff || staff.role === "admin"
  const visibleNavItems = NAV_ITEMS_CONFIG.filter((item) => !item.adminOnly || isAdmin)

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 shrink-0 sm:gap-2.5">
          <h1 className="text-lg font-extrabold tracking-tight text-indigo-600 sm:text-xl md:text-2xl dark:text-indigo-400">
            {shop.name}
          </h1>
          {staff && (
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {staff.role === "admin" ? t("nav.admin", "Admin") : t("nav.staff", "Lễ tân")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs sm:gap-2.5 sm:text-sm md:gap-3 dark:text-slate-400">
          <nav className="flex items-center rounded-xl border border-slate-200 p-0.5 sm:p-1 dark:border-slate-700">
            {visibleNavItems.map(({ view: v, labelKey, defaultLabel }) => (
              <button
                key={v}
                type="button"
                onClick={() => onSelectView(v)}
                className={`whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold transition sm:px-2.5 sm:py-1.5 md:px-3 md:text-sm ${
                  activeView === v
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {t(labelKey, defaultLabel)}
              </button>
            ))}
          </nav>
          <span className="shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">Plan: </span>
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
          <LanguageToggle className="shrink-0" />
          <ThemeToggle className="shrink-0" />
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:px-3 sm:py-1.5 sm:text-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("nav.logout", "Sign out")}
          </button>
        </div>
      </div>
    </header>
  )
}

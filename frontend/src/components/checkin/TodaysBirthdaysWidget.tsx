import { Cake, Filter } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Membership } from "../../lib/memberships"

interface TodaysBirthdaysWidgetProps {
  birthdays: Membership[]
  onFilterBirthdays?: () => void
  onViewMember?: (id: string) => void
}

export function TodaysBirthdaysWidget({
  birthdays,
  onFilterBirthdays,
  onViewMember,
}: TodaysBirthdaysWidgetProps) {
  const { t } = useTranslation()

  if (!birthdays || birthdays.length === 0) return null

  return (
    <div
      role="region"
      aria-label={t("checkin.todays_birthdays_aria", "Hội viên sinh nhật hôm nay")}
      className="flex flex-col gap-3 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 p-3.5 shadow-xs transition sm:flex-row sm:items-center sm:justify-between dark:border-pink-900/50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-amber-950/20"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-xs shadow-pink-200 dark:shadow-none">
          <Cake className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-pink-950 dark:text-pink-100">
              {t("checkin.todays_birthdays_heading", "Hôm nay có {{count}} hội viên sinh nhật!", {
                count: birthdays.length,
              })}
            </h3>
            <span className="inline-flex items-center rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-extrabold text-pink-700 dark:bg-pink-900/80 dark:text-pink-300">
              🎂 {birthdays.length}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {birthdays.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onViewMember?.(m.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-pink-200/80 bg-white/90 px-2 py-0.5 text-xs font-semibold text-pink-800 transition hover:bg-pink-100/80 dark:border-pink-800/60 dark:bg-slate-900/80 dark:text-pink-300 dark:hover:bg-pink-950/60"
              >
                <span>{m.customer_name}</span>
                <span className="text-[10px] text-pink-500 dark:text-pink-400">({m.phone})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {onFilterBirthdays && (
        <button
          type="button"
          onClick={onFilterBirthdays}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-pink-300 bg-white px-3 py-1.5 text-xs font-bold text-pink-700 shadow-2xs transition hover:bg-pink-50 dark:border-pink-800 dark:bg-slate-900 dark:text-pink-300 dark:hover:bg-pink-950/50"
        >
          <Filter className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
          <span>{t("checkin.filter_birthdays_btn", "Lọc danh sách sinh nhật")}</span>
        </button>
      )}
    </div>
  )
}

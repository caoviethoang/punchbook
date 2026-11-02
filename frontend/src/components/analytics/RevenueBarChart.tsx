import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { DailyRevenueData } from "../../lib/dashboard"
import { formatDate, formatVnd } from "../../lib/formatters"

interface RevenueBarChartProps {
  dailyRevenue: DailyRevenueData[]
}

export function RevenueBarChart({ dailyRevenue }: RevenueBarChartProps) {
  const { t } = useTranslation()
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null)

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1)
  const total30DaysRevenue = dailyRevenue.reduce((acc, d) => acc + d.revenue, 0)
  const avgDailyRevenue = Math.round(total30DaysRevenue / (dailyRevenue.length || 1))

  return (
    <div className="mt-6 space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {t("dashboard.total_30d_revenue", "Tổng doanh thu 30 ngày")}
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {formatVnd(total30DaysRevenue)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t("dashboard.daily_avg_revenue", "Trung bình ngày")}
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {formatVnd(avgDailyRevenue)}
          </p>
        </div>
      </div>

      {/* SVG Bar / Trend Chart */}
      <div className="relative">
        <div className="flex h-56 items-end gap-1.5 border-b border-slate-100 pb-6 pt-8 dark:border-slate-800">
          {dailyRevenue.map((item, idx) => {
            const heightPercent = Math.max(
              (item.revenue / maxRevenue) * 100,
              item.revenue > 0 ? 8 : 2,
            )
            const isHovered = hoveredRevenueIndex === idx

            return (
              <div
                key={item.date}
                onMouseEnter={() => setHoveredRevenueIndex(idx)}
                onMouseLeave={() => setHoveredRevenueIndex(null)}
                className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="pointer-events-none absolute -top-12 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
                    <div>{formatDate(item.date)}</div>
                    <div className="text-emerald-400 dark:text-emerald-600">
                      {formatVnd(item.revenue)}
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-sm transition-all duration-200 ${
                    isHovered
                      ? "bg-indigo-600 dark:bg-indigo-400"
                      : item.revenue > 0
                        ? "bg-indigo-500/80 hover:bg-indigo-600 dark:bg-indigo-600/70 dark:hover:bg-indigo-500"
                        : "bg-slate-100 dark:bg-slate-800"
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* X-Axis labels */}
        <div className="mt-2 flex justify-between px-1 text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>{dailyRevenue[0] ? formatDate(dailyRevenue[0].date) : ""}</span>
          <span>
            {dailyRevenue[Math.floor(dailyRevenue.length / 2)]
              ? formatDate(dailyRevenue[Math.floor(dailyRevenue.length / 2)].date)
              : ""}
          </span>
          <span>
            {dailyRevenue[dailyRevenue.length - 1]
              ? formatDate(dailyRevenue[dailyRevenue.length - 1].date)
              : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

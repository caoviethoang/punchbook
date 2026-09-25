import { useState } from "react"
import {
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import type {
  DailyRevenueData,
  HourlyCheckInData,
  PeakHourData,
} from "../lib/dashboard"
import { formatDate, formatVnd } from "../lib/formatters"

interface AnalyticsChartsProps {
  dailyRevenue?: DailyRevenueData[]
  checkInFrequency?: HourlyCheckInData[]
  peakHour?: PeakHourData | null
}

export function AnalyticsCharts({
  dailyRevenue = [],
  checkInFrequency = [],
  peakHour,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "checkins">("revenue")
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null)
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null)

  // Calculations for Revenue Chart
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1)
  const total30DaysRevenue = dailyRevenue.reduce((acc, d) => acc + d.revenue, 0)
  const avgDailyRevenue = Math.round(total30DaysRevenue / (dailyRevenue.length || 1))

  // Calculations for Check-in Frequency Chart
  const maxCheckIns = Math.max(...checkInFrequency.map((h) => h.count), 1)
  const totalCheckIns = checkInFrequency.reduce((acc, h) => acc + h.count, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      {/* Header & Tab Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Phân tích & Thống kê Kinh doanh
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi xu hướng doanh thu và phân bố lượt khách ghé tiệm
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("revenue")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "revenue"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Doanh thu 30 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("checkins")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "checkins"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Tần suất Check-in 24h</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Revenue Chart */}
      {activeTab === "revenue" && (
        <div className="mt-6 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Tổng doanh thu 30 ngày
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                {formatVnd(total30DaysRevenue)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Trung bình ngày
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                {formatVnd(avgDailyRevenue)}
              </p>
            </div>
          </div>

          {/* SVG Bar / Trend Chart */}
          <div className="relative">
            <div className="flex h-56 items-end gap-1.5 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
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
                    className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
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

            {/* X-Axis labels (Show first, middle, last dates) */}
            <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500 font-medium px-1">
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
      )}

      {/* Tab 2: Check-in Frequency Chart */}
      {activeTab === "checkins" && (
        <div className="mt-6 space-y-5">
          {/* Peak hour recommendation banner */}
          {peakHour && peakHour.count > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h4 className="font-bold text-sm">Gợi ý phân bổ nhân sự</h4>
                <p className="mt-0.5 text-xs font-medium leading-relaxed">
                  {peakHour.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Tổng lượt check-in ghi nhận: {totalCheckIns} lượt</span>
            </div>
          )}

          {/* SVG 24h Histogram */}
          <div className="relative">
            <div className="flex h-56 items-end gap-1 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              {checkInFrequency.map((item, idx) => {
                const heightPercent = Math.max(
                  (item.count / maxCheckIns) * 100,
                  item.count > 0 ? 8 : 2,
                )
                const isPeak = peakHour?.hour === item.hour && item.count > 0
                const isHovered = hoveredHourIndex === idx

                return (
                  <div
                    key={item.hour}
                    onMouseEnter={() => setHoveredHourIndex(idx)}
                    onMouseLeave={() => setHoveredHourIndex(null)}
                    className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="pointer-events-none absolute -top-12 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
                        <div>Khung giờ: {item.label}</div>
                        <div className="text-amber-400 dark:text-amber-600">
                          {item.count} lượt check-in
                        </div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-200 ${
                        isPeak
                          ? "bg-amber-500 animate-pulse dark:bg-amber-400"
                          : isHovered
                            ? "bg-indigo-600 dark:bg-indigo-400"
                            : item.count > 0
                              ? "bg-indigo-500/70 hover:bg-indigo-600 dark:bg-indigo-600/60"
                              : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    />
                  </div>
                )
              })}
            </div>

            {/* X-Axis labels for 24h (Every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00) */}
            <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500 font-medium px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

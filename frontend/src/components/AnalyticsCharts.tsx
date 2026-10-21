import { useState } from "react"
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react"
import type { DailyRevenueData, HourlyCheckInData, PackageRevenueData, PeakHourData } from "../lib/dashboard"
import { RevenueBarChart } from "./analytics/RevenueBarChart"
import { CheckInFrequencyChart } from "./analytics/CheckInFrequencyChart"
import { PackageRevenueChart } from "./analytics/PackageRevenueChart"

interface AnalyticsChartsProps {
  dailyRevenue?: DailyRevenueData[]
  checkInFrequency?: HourlyCheckInData[]
  peakHour?: PeakHourData | null
  packageRevenue?: PackageRevenueData[]
}

const TABS = [
  { id: "revenue" as const, label: "Doanh thu 30 ngày", icon: TrendingUp },
  { id: "packages" as const, label: "Doanh thu theo gói", icon: PieChart },
  { id: "checkins" as const, label: "Tần suất Check-in 24h", icon: Users },
]

export function AnalyticsCharts({
  dailyRevenue = [],
  checkInFrequency = [],
  peakHour,
  packageRevenue = [],
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "packages" | "checkins">("revenue")

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <BarChart3 className="h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>Phân tích & Thống kê Kinh doanh</span>
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi xu hướng doanh thu, cơ cấu gói dịch vụ và phân bố lượt khách ghé tiệm
          </p>
        </div>

        <div className="inline-flex max-w-full shrink-0 items-center overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === id
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "revenue" && <RevenueBarChart dailyRevenue={dailyRevenue} />}
      {activeTab === "packages" && <PackageRevenueChart packageRevenue={packageRevenue} />}
      {activeTab === "checkins" && (
        <CheckInFrequencyChart checkInFrequency={checkInFrequency} peakHour={peakHour || null} />
      )}
    </div>
  )
}

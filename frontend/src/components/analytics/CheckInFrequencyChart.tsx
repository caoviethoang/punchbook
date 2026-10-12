import { useState } from "react"
import { Calendar, Sparkles } from "lucide-react"
import type { HourlyCheckInData, PeakHourData } from "../../lib/dashboard"

interface CheckInFrequencyChartProps {
  checkInFrequency: HourlyCheckInData[]
  peakHour: PeakHourData | null
}

export function CheckInFrequencyChart({
  checkInFrequency,
  peakHour,
}: CheckInFrequencyChartProps) {
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null)

  const maxCheckIns = Math.max(...checkInFrequency.map((h) => h.count), 1)
  const totalCheckIns = checkInFrequency.reduce((acc, h) => acc + h.count, 0)

  return (
    <div className="mt-6 space-y-5">
      {/* Peak hour recommendation banner */}
      {peakHour && peakHour.count > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-bold">Gợi ý phân bổ nhân sự</h4>
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
        <div className="flex h-56 items-end gap-1 border-b border-slate-100 pb-6 pt-8 dark:border-slate-800">
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
                className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
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
                      ? "animate-pulse bg-amber-500 dark:bg-amber-400"
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

        {/* X-Axis labels */}
        <div className="mt-2 flex justify-between px-1 text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  )
}

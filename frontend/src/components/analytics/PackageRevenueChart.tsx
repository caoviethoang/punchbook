import { useState } from "react"
import { Package, Award, ShoppingBag, PieChart } from "lucide-react"
import type { PackageRevenueData } from "../../lib/dashboard"
import { formatVnd } from "../../lib/formatters"

interface PackageRevenueChartProps {
  packageRevenue?: PackageRevenueData[]
}

const PALETTE = [
  { bg: "bg-indigo-500 dark:bg-indigo-400", text: "text-indigo-600 dark:text-indigo-400" },
  { bg: "bg-emerald-500 dark:bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-500 dark:bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-violet-500 dark:bg-violet-400", text: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-rose-500 dark:bg-rose-400", text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-sky-500 dark:bg-sky-400", text: "text-sky-600 dark:text-sky-400" },
  { bg: "bg-teal-500 dark:bg-teal-400", text: "text-teal-600 dark:text-teal-400" },
  { bg: "bg-fuchsia-500 dark:bg-fuchsia-400", text: "text-fuchsia-600 dark:text-fuchsia-400" },
]

export function PackageRevenueChart({ packageRevenue = [] }: PackageRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalRevenue = packageRevenue.reduce((acc, item) => acc + item.total_revenue, 0)
  const totalSales = packageRevenue.reduce((acc, item) => acc + item.sales_count, 0)
  const topPackage = packageRevenue.length > 0 ? packageRevenue[0] : null

  if (packageRevenue.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Package className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
          Chưa có dữ liệu doanh thu gói
        </h4>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Chưa có giao dịch thanh toán gói dịch vụ nào được ghi nhận trong tháng này.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Metric summary highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <PieChart className="h-4 w-4" />
            <span>Doanh thu gói tháng này</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {formatVnd(totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="h-4 w-4" />
            <span>Tổng lượt bán</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {totalSales} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">lượt</span>
          </p>
        </div>

        <div className="rounded-xl bg-amber-50/60 p-4 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Award className="h-4 w-4" />
            <span>Gói bán chạy nhất</span>
          </div>
          <p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-slate-50" title={topPackage?.package_name}>
            {topPackage?.package_name || "—"}
          </p>
          {topPackage && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {topPackage.sales_count} lượt bán • {formatVnd(topPackage.total_revenue)}
            </p>
          )}
        </div>
      </div>

      {/* Visual Stacked Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Tỷ lệ đóng góp doanh thu theo gói</span>
          <span>100%</span>
        </div>
        <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 dark:bg-slate-800">
          {packageRevenue.map((item, index) => {
            const color = PALETTE[index % PALETTE.length]
            const width = Math.max(item.percentage, 2)
            const isHovered = hoveredIndex === index

            return (
              <div
                key={item.package_id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ width: `${width}%` }}
                title={`${item.package_name}: ${item.percentage}% (${formatVnd(item.total_revenue)})`}
                className={`relative h-full transition-all duration-200 cursor-pointer first:rounded-l-full last:rounded-r-full ${
                  color.bg
                } ${isHovered ? "ring-2 ring-indigo-500 ring-offset-1 z-10" : "opacity-90 hover:opacity-100"}`}
              />
            )
          })}
        </div>
      </div>

      {/* Detailed Package Revenue Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Tên gói dịch vụ</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">Số lượng bán</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Tổng doanh thu</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {packageRevenue.map((item, index) => {
                const color = PALETTE[index % PALETTE.length]
                const isHovered = hoveredIndex === index

                return (
                  <tr
                    key={item.package_id}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`transition-colors ${
                      isHovered
                        ? "bg-slate-50/80 dark:bg-slate-800/50"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.bg}`} />
                        <span>{item.package_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {item.sales_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatVnd(item.total_revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            className={`h-full rounded-full ${color.bg}`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

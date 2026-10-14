import type { ReactNode } from "react"

export interface MetricCardProps {
  label: string
  value: string
  icon: ReactNode
  onClick?: () => void
  active?: boolean
}

export function MetricCard({
  label,
  value,
  icon,
  onClick,
  active = false,
}: MetricCardProps) {
  const isClickable = Boolean(onClick)

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${
        active
          ? "border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400"
          : "border-slate-200 dark:border-slate-800"
      } ${
        isClickable
          ? "cursor-pointer hover:border-indigo-300 hover:shadow-md dark:hover:border-slate-700"
          : ""
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  )
}

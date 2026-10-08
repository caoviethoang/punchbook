import { Calendar, Package as PackageIcon } from "lucide-react"
import type { MembershipDetail } from "../../lib/memberships"
import { remainingLabel } from "../../lib/formatters"
import { StatusBadge } from "../ui/StatusBadge"

interface MembershipDetailHeaderProps {
  detail: MembershipDetail
}

export function MembershipDetailHeader({ detail }: MembershipDetailHeaderProps) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {detail.customer_name}
          </h3>
          <p className="mt-0.5 text-base font-medium text-slate-500 dark:text-slate-400">
            {detail.phone}
          </p>
        </div>
        <StatusBadge status={detail.status} type="membership" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <PackageIcon className="h-4 w-4 shrink-0" />
          <span>{detail.package.name}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
          <span>{remainingLabel(detail)}</span>
        </div>
      </div>
    </div>
  )
}

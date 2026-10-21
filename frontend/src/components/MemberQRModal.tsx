import { X } from "lucide-react"
import type { Membership } from "../lib/memberships"
import { DigitalMembershipCard } from "./DigitalMembershipCard"

interface MemberQRModalProps {
  membership: Membership | null
  shopName?: string
  onClose: () => void
}

export function MemberQRModal({ membership, shopName, onClose }: MemberQRModalProps) {
  if (!membership) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Đóng</span>
        </button>

        <DigitalMembershipCard membership={membership} shopName={shopName} />
      </div>
    </div>
  )
}

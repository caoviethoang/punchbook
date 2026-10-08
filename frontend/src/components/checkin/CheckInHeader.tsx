import { QrCode, UserCheck } from "lucide-react"

interface CheckInHeaderProps {
  onOpenQRScanner: () => void
}

export function CheckInHeader({ onOpenQRScanner }: CheckInHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <UserCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Check-in Hội Viên
        </h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          Tìm kiếm theo tên hoặc số điện thoại để điểm danh hội viên
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenQRScanner}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 dark:shadow-none"
      >
        <QrCode className="h-5 w-5" />
        <span>Quét mã QR</span>
      </button>
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  Smartphone,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { toApiError } from "../../lib/errors"
import { formatDate, formatDateTime, formatVnd } from "../../lib/formatters"
import {
  fetchMemberPortalHistory,
  fetchMemberPortalProfile,
  renewMemberPortal,
  type PortalHistoryResponse,
  type PortalMemberProfile,
  type PortalPackage,
  type PortalRenewResponse,
} from "../../lib/memberPortal"
import { LanguageToggle } from "../ui/LanguageToggle"
import { ThemeToggle } from "../ui/ThemeToggle"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface MemberPortalScreenProps {
  token: string
}

type PortalTab = "card" | "checkins" | "invoices"

export function MemberPortalScreen({ token }: MemberPortalScreenProps) {
  const { t } = useTranslation()
  const [member, setMember] = useState<PortalMemberProfile | null>(null)
  const [packages, setPackages] = useState<PortalPackage[]>([])
  const [history, setHistory] = useState<PortalHistoryResponse | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PortalTab>("card")

  // Self-renewal state
  const [isRenewOpen, setIsRenewOpen] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState<string>("")
  const [renewing, setRenewing] = useState(false)
  const [renewError, setRenewError] = useState<string | null>(null)
  const [renewResult, setRenewResult] = useState<PortalRenewResponse | null>(null)

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissPwaBanner, setDismissPwaBanner] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([fetchMemberPortalProfile(token), fetchMemberPortalHistory(token)])
      .then(async ([profileRes, historyRes]) => {
        if (!active) return
        setMember(profileRes.member)
        setPackages(profileRes.available_packages)
        setSelectedPkgId(profileRes.member.package.id)
        setHistory(historyRes)

        try {
          const url = await QRCode.toDataURL(profileRes.member.qr_code_value, {
            width: 240,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
          })
          if (active) setQrDataUrl(url)
        } catch {
          // Ignore QR failure
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            toApiError(
              err,
              t("portal.load_error", "Không thể tải thông tin thẻ hội viên. Liên kết có thể đã hết hạn."),
            ),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token, t])

  const progressStats = useMemo(() => {
    if (!member) return null

    if (member.sessions_left !== null && member.sessions_left !== undefined) {
      const total = member.package.sessions_count || Math.max(member.sessions_left, 1)
      const pct = Math.max(0, Math.min(100, (member.sessions_left / total) * 100))
      return {
        type: "sessions" as const,
        remaining: member.sessions_left,
        total,
        pct,
        label: t("portal.sessions_progress", "Còn {{left}}/{{total}} buổi", {
          left: member.sessions_left,
          total,
        }),
      }
    }

    if (member.expires_at) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const expiry = new Date(member.expires_at)
      expiry.setHours(0, 0, 0, 0)
      const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000))
      const totalDays = member.package.duration_days || 30
      const pct = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100))
      return {
        type: "days" as const,
        remaining: daysLeft,
        total: totalDays,
        pct,
        label: t("portal.days_progress", "Còn {{days}} ngày (HSD: {{date}})", {
          days: daysLeft,
          date: formatDate(member.expires_at),
        }),
      }
    }

    return null
  }, [member, t])

  const handleTriggerInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === "accepted") {
      setInstallPrompt(null)
    }
  }

  const handleRenewSubmit = async () => {
    setRenewing(true)
    setRenewError(null)
    try {
      const res = await renewMemberPortal(token, selectedPkgId || undefined)
      setRenewResult(res)
      const updatedHistory = await fetchMemberPortalHistory(token)
      setHistory(updatedHistory)
    } catch (err) {
      setRenewError(toApiError(err, t("portal.renew_failed", "Không thể tạo link thanh toán. Vui lòng thử lại.")))
    } finally {
      setRenewing(false)
    }
  }

  const statusBadge = (status: PortalMemberProfile["status"]) => {
    switch (status) {
      case "active":
        return {
          label: t("status.active", "Hoạt động"),
          cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
        }
      case "expiring":
        return {
          label: t("status.expiring", "Sắp hết hạn"),
          cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
        }
      case "frozen":
        return {
          label: t("status.frozen", "Đang bảo lưu"),
          cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
        }
      default:
        return {
          label: t("status.expired", "Hết hạn"),
          cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
        }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("portal.error_title", "Không tìm thấy thẻ hội viên")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  const badge = statusBadge(member.status)
  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || member.package
  const hasBankConfig = Boolean(member.shop.bank_name && member.shop.bank_account_no)
  const vietQrUrl =
    hasBankConfig && renewResult
      ? `https://img.vietqr.io/image/${member.shop.bank_name}-${member.shop.bank_account_no}-compact2.png?amount=${renewResult.invoice.amount}&addInfo=${encodeURIComponent(
          `Gia han ${member.customer_name} ${member.phone}`,
        )}&accountName=${encodeURIComponent(member.shop.bank_account_name || "")}`
      : ""

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top App Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t("portal.app_badge", "Thẻ Hội Viên")}
            </p>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
              {member.shop.name}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* PWA Install Prompt */}
        {installPrompt && !dismissPwaBanner && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-indigo-950 dark:text-indigo-100">
                  {t("portal.pwa_title", "Lưu thẻ vào màn hình chính")}
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  {t("portal.pwa_subtitle", "Mở nhanh mã QR check-in như ứng dụng di động")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleTriggerInstall()}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 font-semibold text-white hover:bg-indigo-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t("portal.pwa_install", "Cài đặt")}</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissPwaBanner(true)}
                aria-label={t("common.close", "Đóng")}
                className="rounded-lg p-1 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Segmented Tabs */}
        <div className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              { id: "card", label: t("portal.tab_card", "Thẻ & QR"), icon: QrCode },
              { id: "checkins", label: t("portal.tab_checkins", "Lịch sử tập"), icon: History },
              { id: "invoices", label: t("portal.tab_invoices", "Hóa đơn"), icon: CreditCard },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                activeTab === id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "card" ? (
          <div className="space-y-4">
            {/* Digital Membership Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
              {/* Top Gradient Header */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-5 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                      {member.package.name}
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold">{member.customer_name}</h2>
                    <p className="mt-0.5 text-xs text-indigo-100">{member.phone}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                {member.assigned_staff && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>
                      {t("portal.assigned_pt", "PT phụ trách:")} {member.assigned_staff.name}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center p-6 text-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={t("portal.qr_alt", "Mã QR Check-in")}
                      className="h-44 w-44"
                    />
                  ) : (
                    <div className="flex h-44 w-44 items-center justify-center text-slate-300">
                      <QrCode className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <p className="mt-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("portal.qr_instruction", "Đưa mã QR này cho lễ tân hoặc máy quét khi đến tập")}
                </p>

                {/* Progress Bar */}
                {progressStats && (
                  <div className="mt-5 w-full rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">{progressStats.label}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {Math.round(progressStats.pct)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressStats.pct <= 20
                            ? "bg-rose-500"
                            : progressStats.pct <= 40
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${progressStats.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Self-Renewal CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setRenewResult(null)
                    setRenewError(null)
                    setIsRenewOpen(true)
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{t("portal.renew_now", "Gia hạn gói tập ngay")}</span>
                </button>
              </div>
            </div>

            {/* Studio Contact Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {t("portal.studio_info", "Thông tin phòng tập")}
              </p>
              <div className="mt-2 space-y-1.5 text-slate-500 dark:text-slate-400">
                {member.shop.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{member.shop.phone}</span>
                  </p>
                )}
                {member.shop.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{member.shop.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "checkins" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t("portal.checkin_history_title", "Lịch sử điểm danh gần đây")}
            </h3>
            {!history || history.check_ins.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Clock className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                <p>{t("portal.empty_checkins", "Chưa có lượt check-in nào.")}</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {history.check_ins.map((ci) => (
                  <li key={ci.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {t("portal.checkin_label", "Điểm danh thành công")}
                      </span>
                    </div>
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDateTime(ci.checked_in_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t("portal.invoices_title", "Hóa đơn & Thanh toán")}
            </h3>
            {!history || history.invoices.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Calendar className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                <p>{t("portal.empty_invoices", "Chưa có hóa đơn thanh toán nào.")}</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {history.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {formatVnd(inv.amount)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {inv.status === "paid"
                          ? t("portal.invoice_paid", "Đã thanh toán")
                          : t("portal.invoice_pending", "Chờ thanh toán")}
                      </span>
                      {inv.status === "pending" && inv.payos_checkout_url && (
                        <a
                          href={inv.payos_checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* Self-Renewal Modal */}
      {isRenewOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t("portal.renew_modal_title", "Gia hạn gói tập")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRenewOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renewError && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {renewError}
              </div>
            )}

            {!renewResult ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="portal-renew-package"
                    className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {t("portal.select_package", "Chọn gói gia hạn")}
                  </label>
                  <select
                    id="portal-renew-package"
                    value={selectedPkgId}
                    onChange={(e) => setSelectedPkgId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {formatVnd(pkg.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{t("portal.package_price", "Thành tiền")}</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatVnd(selectedPkg.price)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={renewing}
                  onClick={() => void handleRenewSubmit()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {renewing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t("portal.generate_payment", "Tạo mã thanh toán VietQR / payOS")}</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-center">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("portal.payment_created", "Đã tạo yêu cầu thanh toán thành công!")}
                </p>

                {vietQrUrl && (
                  <div className="mx-auto inline-block rounded-2xl border border-slate-200 bg-white p-3">
                    <img
                      src={vietQrUrl}
                      alt="VietQR"
                      className="h-52 w-52 object-contain"
                    />
                  </div>
                )}

                {renewResult.payos.checkout_url && (
                  <a
                    href={renewResult.payos.checkout_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500"
                  >
                    <span>{t("portal.open_payos", "Mở trang thanh toán payOS")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, CheckCircle2, HeartHandshake, RefreshCw, Send } from "lucide-react"
import {
  fetchChurnRiskReport,
  sendMemberReengagement,
  type AtRiskMemberItem,
  type ChurnRiskLevel,
  type ChurnRiskReportResponse,
} from "../../lib/churnRisk"

interface RetentionRiskWidgetProps {
  onSelectDetail?: (membershipId: string) => void
}

const RISK_BADGE_STYLES: Record<ChurnRiskLevel, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  low: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
}

function formatCurrencyVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function RetentionRiskWidget({ onSelectDetail }: RetentionRiskWidgetProps) {
  const { t } = useTranslation()
  const [report, setReport] = useState<ChurnRiskReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    fetchChurnRiskReport()
      .then((data) => {
        if (!active) return
        setReport(data)
        setError(null)
        setHasError(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : null)
        setHasError(true)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadTick])

  const handleRefresh = () => {
    setLoading(true)
    setFeedback(null)
    setReloadTick((prev) => prev + 1)
  }

  const handleSendReengagement = async (member: AtRiskMemberItem) => {
    setSendingId(member.membership_id)
    setFeedback(null)
    try {
      await sendMemberReengagement(member.membership_id)
      setSentIds((prev) => ({ ...prev, [member.membership_id]: true }))
      setReport((prev) => {
        if (!prev) return prev
        const nowIso = new Date().toISOString()
        return {
          ...prev,
          members: prev.members.map((item) =>
            item.membership_id === member.membership_id
              ? { ...item, last_reengagement_sent_at: nowIso }
              : item,
          ),
        }
      })
      setFeedback({
        type: "success",
        text: t("churn_risk.reengagement_sent", { name: member.customer_name }),
      })
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : t("churn_risk.reengagement_error"),
      })
    } finally {
      setSendingId(null)
    }
  }

  const summary = report?.summary
  const topMembers = (report?.members ?? []).slice(0, 5)

  return (
    <section
      aria-label={t("churn_risk.widget_title")}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("churn_risk.widget_title")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("churn_risk.widget_subtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          aria-label={t("churn_risk.refresh")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("churn_risk.refresh")}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-4 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading && !report ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70"
            />
          ))}
        </div>
      ) : hasError ? (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error || t("churn_risk.load_error")}
        </div>
      ) : summary && summary.total_at_risk === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{t("churn_risk.empty_state")}</span>
        </div>
      ) : summary ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("churn_risk.total_at_risk")}
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_at_risk}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("churn_risk.risk_breakdown")}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-red-600 dark:text-red-400">
                  {t("churn_risk.high_short", { count: summary.high_risk_count })}
                </span>
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-600 dark:text-amber-400">
                  {t("churn_risk.medium_short", { count: summary.medium_risk_count })}
                </span>
                <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-sky-600 dark:text-sky-400">
                  {t("churn_risk.low_short", { count: summary.low_risk_count })}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("churn_risk.revenue_at_stake")}
              </div>
              <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrencyVnd(summary.revenue_at_stake)}
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {topMembers.map((member) => {
              const isSending = sendingId === member.membership_id
              const wasSent = Boolean(sentIds[member.membership_id] || member.last_reengagement_sent_at)

              return (
                <div
                  key={member.membership_id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {onSelectDetail ? (
                        <button
                          type="button"
                          onClick={() => onSelectDetail(member.membership_id)}
                          className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                        >
                          {member.customer_name}
                        </button>
                      ) : (
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {member.customer_name}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${RISK_BADGE_STYLES[member.risk_level]}`}
                      >
                        {t(`churn_risk.level_${member.risk_level}`)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{member.package_name}</span>
                      <span>•</span>
                      <span>
                        {t("churn_risk.days_absent", { days: member.days_since_last_visit })}
                      </span>
                      {member.frequency_drop_pct > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {t("churn_risk.drop_pct", { pct: member.frequency_drop_pct })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendReengagement(member)}
                    disabled={isSending}
                    aria-label={t("churn_risk.send_we_miss_you_aria", { name: member.customer_name })}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      wasSent
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {wasSent ? (
                      <>
                        <HeartHandshake className="h-3.5 w-3.5" />
                        {t("churn_risk.sent_again")}
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        {isSending ? t("churn_risk.sending") : t("churn_risk.send_we_miss_you")}
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </section>
  )
}

import { CheckCircle2, Award, Clock, ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { KioskCheckInResult } from "../../lib/kiosk"

interface KioskSuccessViewProps {
  result: KioskCheckInResult
  onReset: () => void
  autoResetSeconds?: number
}

export function KioskSuccessView({
  result,
  onReset,
  autoResetSeconds = 3,
}: KioskSuccessViewProps) {
  const { t } = useTranslation()
  const [secondsRemaining, setSecondsRemaining] = useState(autoResetSeconds)
  const member = result.membership

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          onReset()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [onReset])

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / autoResetSeconds) * 100))

  return (
    <div
      role="region"
      aria-label={t("kiosk.success_title", "Check-in thành công")}
      className="flex flex-col items-center justify-between w-full max-w-lg min-h-[440px] p-8 mx-auto rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex flex-col items-center w-full">
        {/* Animated Checkmark Icon with Glow */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <CheckCircle2 className="w-14 h-14 animate-bounce" />
        </div>

        {/* Milestone Celebration Pill */}
        {result.milestone_reached && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1 mb-3 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold shadow-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              {t("kiosk.milestone_badge", "Cột mốc {{count}} lần check-in! 🏆", { count: result.milestone_reached })}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        )}

        {/* Big Greeting */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t("kiosk.welcome_greeting", "Xin chào, {{name}}!", { name: member?.customer_name || t("common.member", "Hội viên") })}
        </h2>
        <p className="mt-1 text-base sm:text-lg font-medium text-emerald-400">
          {t("kiosk.access_granted", "Mời bạn vào tập")}
        </p>

        {/* Member Details Card */}
        {member && (
          <div className="w-full mt-6 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/60 text-xs text-slate-400">
              <span>{member.package?.name || ""}</span>
              <span className="font-mono text-slate-300">{member.phone}</span>
            </div>

            <div className="flex items-center justify-between pt-3 text-sm">
              <span className="text-slate-400">{t("memberships.sessions_left_label", "Số buổi còn lại:")}</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {member.sessions_left !== null
                  ? `${member.sessions_left} ${t("common.sessions", "buổi")}`
                  : member.expires_at
                    ? `${t("memberships.expires_at", "Hạn:")} ${member.expires_at}`
                    : t("memberships.unlimited", "Không giới hạn")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Auto Reset Timer with Progress Bar */}
      <div className="w-full mt-8 flex flex-col items-center">
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{t("kiosk.auto_reset_hint", "Tự động quay lại sau {{seconds}}s", { seconds: secondsRemaining })}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  )
}

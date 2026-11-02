import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { changeAppLanguage, type SupportedLanguage } from "../../i18n"

interface LanguageToggleProps {
  className?: string
  showLabel?: boolean
}

export function LanguageToggle({ className = "", showLabel = false }: LanguageToggleProps) {
  const { i18n } = useTranslation()
  const currentLang = (i18n.language?.startsWith("en") ? "en" : "vi") as SupportedLanguage
  const isEn = currentLang === "en"
  const nextLang: SupportedLanguage = isEn ? "vi" : "en"

  const handleToggle = () => {
    void changeAppLanguage(nextLang)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isEn ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
      title={isEn ? "Switch to Vietnamese (Tiếng Việt)" : "Switch to English"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:px-2.5 sm:py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white ${className}`}
    >
      <Globe className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {currentLang}
      </span>
      {showLabel && (
        <span className="text-xs font-medium sm:text-sm">
          {isEn ? "English" : "Tiếng Việt"}
        </span>
      )}
    </button>
  )
}

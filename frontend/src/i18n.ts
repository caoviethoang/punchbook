import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import vi from "./locales/vi.json"

export const LANGUAGE_STORAGE_KEY = "punchbook_language"

export type SupportedLanguage = "vi" | "en"

export function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === "vi" || stored === "en") {
    return stored
  }
  return "vi"
}

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false,
  },
})

i18n.on("languageChanged", (lng: string) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  } catch {
    // ignore storage errors in restrictive environments
  }
})

export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang)
}

export default i18n

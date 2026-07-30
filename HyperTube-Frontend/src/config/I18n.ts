import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "@config/locales/en/translation.json";
import translationFR from "@config/locales/fr/translation.json";
import translationES from "@config/locales/es/translation.json";
import translationDE from "@config/locales/de/translation.json";

i18n
  .use(LanguageDetector) // auto-detect language from browser/localStorage
  .use(initReactI18next) // connect with react-i18next
  .init({
    resources: {
      en: { translation: translationEN },
      fr: { translation: translationFR },
      es: { translation: translationES },
      de: { translation: translationDE },
    },
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

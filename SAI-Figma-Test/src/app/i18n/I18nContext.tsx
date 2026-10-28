import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { TRANSLATIONS, Translations, useTranslations, LangCode } from "./translations";
import { convertWholeWebsite, translateText, convertWordToWord, translateWord } from "./universalTranslator";

export type SupportedLang = LangCode;

interface I18nContextType {
  lang: string;
  setLang: (newLang: string) => void;
  tr: Translations;
  t: (key: keyof Translations | string, fallback?: string) => string;
  convertWordToWord: (text: string, targetLang?: string) => string;
  translateWord: (word: string, targetLang?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "sai_language";
const VALID_LANGS: string[] = ["en", "hi", "mr", "gu", "ta", "te", "kn", "bn"];

/**
 * Directly communicates with the Google Website Translation engine
 * to convert 100% of the website's DOM nodes into the selected language.
 */
export function applyDomTranslation(targetLang: string) {
  try {
    const langCode = targetLang.toLowerCase();

    // 1. Set Google Translate cookies for domain and root path
    const cookieVal = `/en/${langCode}`;
    const autoVal = `/auto/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${autoVal}; path=/;`;
    if (window.location.hostname) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname};`;
      document.cookie = `googtrans=${autoVal}; path=/; domain=${window.location.hostname};`;
      if (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${window.location.hostname};`;
        document.cookie = `googtrans=${autoVal}; path=/; domain=.${window.location.hostname};`;
      }
    }

    // If English, also clear or set to en/en
    if (langCode === "en") {
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }

    // 2. Programmatically trigger the Google Translate combo dropdown
    const triggerCombo = () => {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        if (combo.value !== langCode) {
          combo.value = langCode;
          combo.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
      }
      return false;
    };

    if (!triggerCombo()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (triggerCombo() || attempts > 25) {
          clearInterval(interval);
        }
      }, 200);
    }

    // 3. Update document language
    document.documentElement.lang = langCode;
  } catch (err) {
    console.warn("DOM translation trigger error:", err);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_LANGS.includes(saved)) {
        return saved;
      }
    } catch {}
    return "en";
  });

  const setLang = (newLang: string) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    convertWholeWebsite(newLang);
    applyDomTranslation(newLang);
  };

  // Run DOM conversion on startup and whenever lang updates
  useEffect(() => {
    if (lang) {
      convertWholeWebsite(lang);
      applyDomTranslation(lang);
    }
  }, [lang]);

  const tr = useMemo(() => useTranslations(lang), [lang]);

  const t = (key: keyof Translations | string, fallback?: string): string => {
    const val = (tr as any)[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
    const raw = fallback ?? String(key);
    return translateText(raw, (lang as LangCode) || "en");
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      tr,
      t,
      convertWordToWord: (text: string, targetLang?: string) =>
        convertWordToWord(text, (targetLang || lang) as LangCode),
      translateWord: (word: string, targetLang?: string) =>
        translateWord(word, (targetLang || lang) as LangCode),
    }),
    [lang, tr]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const fallbackTr = TRANSLATIONS.en;
    return {
      lang: "en",
      setLang: () => {},
      tr: fallbackTr,
      t: (k, fb) => (fallbackTr as any)[k] ?? fb ?? String(k),
      convertWordToWord: (text, l) => convertWordToWord(text, (l || "en") as LangCode),
      translateWord: (word, l) => translateWord(word, (l || "en") as LangCode),
    };
  }
  return ctx;
}

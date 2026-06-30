"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  getDictionary,
  type Locale,
} from "@/lib/translations";

const LOCALE_COOKIE = "tango-locale";

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function setLocaleCookie(l: Locale) {
  if (typeof document === "undefined") return;
  // 1 year
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  // On first mount, if no initialLocale from cookie, detect from browser
  useEffect(() => {
    if (!initialLocale) {
      const detected = detectBrowserLocale();
      if (detected !== locale) {
        setLocaleState(detected);
        setLocaleCookie(detected);
      }
    }
  }, [initialLocale, locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setLocaleCookie(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = getDictionary(locale);
      let val = dict[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          val = val.replace(`{${k}}`, String(vars[k]));
        }
      }
      return val;
    },
    [locale]
  );

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

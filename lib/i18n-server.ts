import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getDictionary,
  type Locale,
} from "@/lib/translations";

const LOCALE_COOKIE = "tango-locale";

export function getServerLocale(): Locale {
  const cookieStore = cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw === "en" || raw === "pt" || raw === "es") return raw;
  return DEFAULT_LOCALE;
}

export function getServerT() {
  const locale = getServerLocale();
  const dict = getDictionary(locale);
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => {
      let val = dict[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          val = val.replace(`{${k}}`, String(vars[k]));
        }
      }
      return val;
    },
  };
}

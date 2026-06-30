"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/translations";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-tango-border tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-yellow hover:border-tango-yellow transition-colors"
        aria-label="Change language"
      >
        <span className="font-bold">{current.flag}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-tango-charcoal border border-tango-border min-w-[140px] shadow-xl">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code as Locale);
                  setOpen(false);
                  // Reload to refresh server components with new locale
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 tg-mono text-[10px] uppercase tracking-widest border-b border-tango-border/40 last:border-b-0 transition-colors flex items-center gap-3",
                  locale === l.code
                    ? "text-tango-yellow bg-tango-panel"
                    : "text-tango-muted hover:text-tango-white hover:bg-tango-panel"
                )}
              >
                <span className="font-bold w-5">{l.flag}</span>
                <span>{l.label}</span>
                {locale === l.code && (
                  <span className="ml-auto text-tango-yellow">●</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

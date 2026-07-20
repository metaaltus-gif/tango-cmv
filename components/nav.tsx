"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PasswordChangeModal } from "@/components/password-change-modal";

const MODULES = [
  { key: "modules.cmv", href: "/dashboard", active: true },
  { key: "modules.shifter", href: "#", active: false },
  { key: "modules.finance", href: "#", active: false, alert: true },
  { key: "modules.people", href: "#", active: false },
  { key: "modules.ops", href: "#", active: false },
];

const SECTIONS = [
  { key: "nav.dashboard", href: "/dashboard" },
  { key: "nav.rules", href: "/regras" },
  { key: "nav.history", href: "/historico" },
  { key: "nav.corrections", href: "/correcoes" },
  { key: "nav.audit", href: "/auditoria" },
];

function firstInitial(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email || "?").trim();
  return (source[0] ?? "?").toUpperCase();
}

export function Nav({
  userEmail,
  userName,
  userRole,
}: {
  userEmail?: string;
  userName?: string | null;
  userRole?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const t = useT();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = userName || userEmail?.split("@")[0] || "?";
  const initial = firstInitial(userName, userEmail);

  return (
    <nav className="border-b border-tango-border bg-tango-black sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 lg:px-8 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/tango-horizontal.png"
              alt="Tango"
              width={260}
              height={64}
              priority
              className="h-14 w-auto"
            />
          </Link>

          <div className="flex items-center gap-3 pl-5 border-l border-tango-border">
            {MODULES.map((m) => (
              <span
                key={m.key}
                className={cn(
                  "tg-mono text-[9px] uppercase tracking-widest2 font-bold cursor-pointer transition-colors flex items-center gap-1",
                  m.active
                    ? "text-tango-yellow"
                    : m.alert
                    ? "text-tango-red"
                    : "text-tango-muted hover:text-tango-white"
                )}
              >
                <span
                  className={cn(
                    "tg-display text-[12px] mr-0.5",
                    m.active ? "text-tango-yellow" : "text-tango-grey font-bold"
                  )}
                >
                  {m.active ? "=" : "+"}
                </span>
                {t(m.key)}
                {m.alert && (
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-tango-red tg-pulse" />
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-4">
            {SECTIONS.map((s) => {
              const active = pathname === s.href || pathname.startsWith(s.href + "/");
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  className={cn(
                    "tg-mono text-[10px] uppercase tracking-widest font-bold transition-colors py-1",
                    active
                      ? "text-tango-white border-b-2 border-tango-yellow"
                      : "text-tango-muted hover:text-tango-white"
                  )}
                >
                  {t(s.key)}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-tango-border tg-mono text-[9px] uppercase tracking-widest text-tango-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t("nav.sync_ok")}
          </div>

          <LocaleSwitcher />

          <div className="flex items-center gap-2.5 pl-4 border-l border-tango-border relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              title={t("common.account_menu") || "Menu da conta"}
            >
              <div className="w-9 h-9 bg-tango-yellow text-tango-black flex items-center justify-center tg-display text-[16px] font-black">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col leading-tight items-start">
                <span className="text-tango-white text-[13px] font-bold tracking-tight">
                  {displayName}
                </span>
                {userRole && (
                  <span className="tg-mono text-[8.5px] uppercase tracking-widest text-tango-muted">
                    {userRole} · {userEmail}
                  </span>
                )}
                {!userRole && userEmail && (
                  <span className="tg-mono text-[8.5px] uppercase tracking-widest text-tango-muted">
                    {userEmail}
                  </span>
                )}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-tango-charcoal border border-tango-border shadow-xl z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPwdOpen(true);
                  }}
                  className="w-full text-left tg-mono text-[10px] uppercase tracking-widest font-bold text-tango-white hover:bg-tango-panel px-4 py-3 border-b border-tango-border transition-colors"
                >
                  {t("common.change_password") || "Alterar senha"}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left tg-mono text-[10px] uppercase tracking-widest font-bold text-tango-muted hover:text-tango-red hover:bg-tango-panel px-4 py-3 transition-colors"
                >
                  {t("common.logout")}
                </button>
              </div>
            )}
          </div>

          {pwdOpen && <PasswordChangeModal onClose={() => setPwdOpen(false)} />}
        </div>
      </div>
    </nav>
  );
}

export function StatusBar({ userName }: { userName?: string | null }) {
  const t = useT();
  return (
    <footer className="border-t border-tango-border bg-tango-black px-6 lg:px-8 py-3 flex gap-6 items-center flex-wrap">
      <StatusItem dot="green" label={t("status.system_active")} />
      <StatusItem dot="yellow" label={t("status.cmv_within")} />
      <StatusItem dot="grey" label={t("status.modules")} />
      {userName && (
        <StatusItem
          dot="yellow"
          label={`SESSION · ${userName.toUpperCase()}`}
        />
      )}
    </footer>
  );
}

function StatusItem({ dot, label }: { dot: "green" | "yellow" | "red" | "grey"; label: string }) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-tango-yellow",
    red: "bg-tango-red",
    grey: "bg-tango-grey",
  };
  return (
    <div className="flex items-center gap-2 tg-mono text-[9px] uppercase tracking-widest text-tango-muted">
      <span className={cn("w-1.5 h-1.5 rounded-full", colors[dot])} />
      {label}
    </div>
  );
}

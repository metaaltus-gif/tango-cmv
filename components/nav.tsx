"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

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
];

function initialFor(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  if (email) return email[0]?.toUpperCase() ?? "?";
  return "?";
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

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = userName || userEmail?.split("@")[0] || "?";
  const initials = initialFor(userName, userEmail).toUpperCase();

  return (
    <nav className="border-b border-tango-border bg-tango-black sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 lg:px-8 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/tango-horizontal.png"
              alt="Tango"
              width={180}
              height={48}
              priority
              className="h-10 w-auto"
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

          {/* User chip */}
          <div className="flex items-center gap-2.5 pl-4 border-l border-tango-border">
            <div className="w-8 h-8 bg-tango-yellow text-tango-black flex items-center justify-center tg-display text-[13px] font-black">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
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
            <button
              onClick={logout}
              className="tg-mono text-[10px] uppercase tracking-widest font-bold text-tango-muted hover:text-tango-red transition-colors ml-2"
            >
              {t("common.logout")}
            </button>
          </div>
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

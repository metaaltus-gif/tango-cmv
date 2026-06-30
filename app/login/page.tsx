"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError(t("login.signup_confirm"));
        setMode("login");
      }
    } catch (e: any) {
      setError(e.message ?? t("login.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-tango-black">
      <div className="border-b border-tango-border px-8 py-4 flex items-center justify-between">
        <Image
          src="/tango-horizontal.png"
          alt="Tango"
          width={180}
          height={48}
          className="h-10 w-auto"
          priority
        />
        <div className="flex items-center gap-4">
          <div className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted hidden md:block">
            {t("login.tagline")}
          </div>
          <LocaleSwitcher />
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 min-h-[600px]">
        <div className="px-8 lg:px-16 py-12 lg:py-20 flex flex-col justify-center border-r border-tango-border relative overflow-hidden">
          <Image
            src="/tango-hat.png"
            alt=""
            width={500}
            height={500}
            aria-hidden
            className="absolute -right-20 -bottom-20 w-[420px] h-[420px] opacity-[0.04] pointer-events-none select-none"
          />

          <div className="relative">
            <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow mb-6">
              {t("login.eyebrow_welcome")}
            </p>
            <h1 className="tg-display text-4xl lg:text-6xl leading-tight mb-6 text-tango-white tracking-tight">
              {t("login.hero_l1")}<br />
              {t("login.hero_l2").replace(t("login.hero_yellow"), "")}<span className="text-tango-yellow">{t("login.hero_yellow")}</span><br />
              {t("login.hero_l3")} <span className="text-tango-red">{t("login.hero_l4")}</span>
            </h1>
            <p className="text-tango-muted text-sm leading-relaxed max-w-md">
              {t("login.subtitle")}
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4 max-w-md">
              <ModulePreview num="01" sub={t("login.module_cost")} name="CMV" tone="yellow" active />
              <ModulePreview num="02" sub={t("login.module_schedule")} name="SHIFTER" tone="yellow" />
              <ModulePreview num="03" sub={t("login.module_finances")} name="FINANCE" tone="red" />
              <ModulePreview num="04" sub={t("login.module_people")} name="PEOPLE" tone="red" />
            </div>
          </div>
        </div>

        <div className="px-8 lg:px-16 py-12 lg:py-20 flex flex-col justify-center bg-tango-charcoal">
          <div className="max-w-sm w-full">
            <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow mb-6">
              {mode === "login" ? t("login.eyebrow_login") : t("login.eyebrow_signup")}
            </p>
            <h2 className="tg-display text-3xl mb-8 leading-tight">
              {mode === "login" ? (
                <>
                  {t("login.title_login_a")}
                  <br />
                  <span className="text-tango-yellow">{t("login.title_login_b")}</span>
                </>
              ) : (
                <>
                  {t("login.title_signup_a")}
                  <br />
                  <span className="text-tango-yellow">{t("login.title_signup_b")}</span>
                </>
              )}
            </h2>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  {t("login.email_label")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.email_placeholder")}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  {t("login.password_label")}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password_placeholder")}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="tg-mono text-[10px] uppercase tracking-wider border border-tango-red text-tango-red px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} variant="primary" size="lg" className="w-full">
                {loading ? "..." : mode === "login" ? t("login.submit_login") : t("login.submit_signup")}
              </Button>
            </form>

            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full mt-6 tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-white transition-colors"
            >
              {mode === "login" ? (
                <>
                  {t("login.toggle_to_signup_a")}{" "}
                  <span className="text-tango-yellow">{t("login.toggle_to_signup_b")}</span>
                </>
              ) : (
                <>
                  {t("login.toggle_to_login_a")}{" "}
                  <span className="text-tango-yellow">{t("login.toggle_to_login_b")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModulePreview({
  num,
  sub,
  name,
  tone,
  active = false,
}: {
  num: string;
  sub: string;
  name: string;
  tone: "yellow" | "red";
  active?: boolean;
}) {
  const t = useT();
  const toneClass = tone === "yellow" ? "text-tango-yellow" : "text-tango-red";
  return (
    <div
      className={`border ${active ? "border-tango-yellow" : "border-tango-border"} p-4 relative`}
    >
      {active && (
        <span className="absolute top-2 right-2 tg-mono text-[8px] uppercase tracking-widest text-tango-black bg-tango-yellow px-1.5 py-0.5">
          {t("modules.active")}
        </span>
      )}
      <div className={`tg-mono text-[9px] uppercase tracking-widest3 mb-2 ${toneClass}`}>
        {num} — {sub}
      </div>
      <div className="tg-display text-lg">{name}</div>
    </div>
  );
}

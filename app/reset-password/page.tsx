"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Verifica se chegou pelo link de email (sessão temporária de recovery)
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
    })();
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ kind: "error", text: t("reset.error_short") });
      return;
    }
    if (password !== confirm) {
      setMessage({ kind: "error", text: t("reset.error_mismatch") });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ kind: "info", text: t("reset.success") });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message ?? t("login.error_generic") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-tango-black">
      <div className="border-b border-tango-border px-8 py-4 flex items-center justify-between">
        <Link href="/login">
          <Image
            src="/tango-horizontal.png"
            alt="Tango"
            width={180}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <LocaleSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-tango-charcoal border border-tango-border p-8 lg:p-10 relative tg-card-line">
          <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow mb-5">
            {t("reset.eyebrow")}
          </p>
          <h1 className="tg-display text-3xl leading-tight mb-3 tracking-tight">
            {t("reset.title_a")}
            <br />
            <span className="text-tango-yellow">{t("reset.title_b")}</span>
          </h1>
          <p className="text-tango-muted text-sm leading-relaxed mb-7">
            {t("reset.subtitle")}
          </p>

          {hasSession === false && (
            <div className="tg-mono text-[10px] uppercase tracking-wider px-3 py-3 border border-tango-red text-tango-red mb-6">
              {t("reset.error_session")}
              <br />
              <Link href="/login" className="text-tango-yellow hover:underline mt-2 inline-block">
                {t("reset.back_to_login")}
              </Link>
            </div>
          )}

          {hasSession !== false && (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  {t("reset.new_label")}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  {t("reset.confirm_label")}
                </label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              {message && (
                <div
                  className={`tg-mono text-[10px] uppercase tracking-wider px-3 py-2 border ${
                    message.kind === "error"
                      ? "border-tango-red text-tango-red"
                      : "border-tango-yellow text-tango-yellow"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={loading} variant="primary" size="lg" className="w-full">
                {loading ? "..." : t("reset.submit")}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="block mt-6 w-full text-center tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-white transition-colors"
          >
            {t("reset.back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}

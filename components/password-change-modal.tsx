"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

export function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({
        kind: "error",
        text: t("reset.error_short") || "Senha muito curta (mínimo 6 caracteres)",
      });
      return;
    }
    if (password !== confirm) {
      setMessage({
        kind: "error",
        text: t("reset.error_mismatch") || "As senhas não coincidem",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({
        kind: "info",
        text: t("reset.success") || "Senha alterada com sucesso!",
      });
      setPassword("");
      setConfirm("");
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      setMessage({
        kind: "error",
        text: e.message ?? (t("login.error_generic") || "Erro ao alterar senha"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-tango-charcoal border border-tango-border max-w-md w-full mx-4 p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tango-muted hover:text-tango-white transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow mb-3">
          {t("common.change_password_eyebrow") || "PERFIL · ALTERAR SENHA"}
        </p>
        <h2 className="tg-display text-2xl tracking-tight mb-5">
          {t("common.change_password") || "Alterar senha"}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-1.5 block">
              {t("reset.new_password") || "NOVA SENHA"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full bg-tango-black border border-tango-border text-tango-white px-3 py-2.5 tg-mono text-sm focus:outline-none focus:border-tango-yellow"
            />
          </div>

          <div>
            <label className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-1.5 block">
              {t("reset.confirm_password") || "CONFIRMAR SENHA"}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full bg-tango-black border border-tango-border text-tango-white px-3 py-2.5 tg-mono text-sm focus:outline-none focus:border-tango-yellow"
            />
          </div>

          {message && (
            <div
              className={`tg-mono text-[11px] uppercase tracking-wider border px-3 py-2.5 ${
                message.kind === "error"
                  ? "border-tango-red text-tango-red"
                  : "border-tango-yellow text-tango-yellow"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 tg-mono text-[10px] uppercase tracking-widest font-bold border border-tango-border text-tango-muted hover:text-tango-white hover:border-tango-white px-4 py-3 transition-colors"
            >
              {t("common.cancel") || "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 tg-mono text-[10px] uppercase tracking-widest font-bold bg-tango-yellow text-tango-black hover:bg-tango-yellow/90 px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("common.saving") || "SALVANDO..."
                : t("common.save") || "SALVAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

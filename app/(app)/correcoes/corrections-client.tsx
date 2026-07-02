"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Correction {
  id: string;
  invoice_id: string | null;
  reported_by: string;
  reported_via: string;
  report_type: string;
  current_value: string | null;
  suggested_value: string | null;
  notes: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  invoices?: {
    invoice_number: string;
    invoice_date: string;
    suppliers?: { name: string };
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  date: "DATA",
  supplier: "FORNECEDOR",
  amount: "VALOR",
  classification: "CLASSIFICAÇÃO",
  missing: "ITEM FALTANDO",
  other: "OUTRO",
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: "PENDENTE", cls: "border-tango-yellow text-tango-yellow" },
  in_review: { label: "EM ANÁLISE", cls: "border-tango-white text-tango-white" },
  applied: { label: "APLICADA", cls: "border-green-500 text-green-500" },
  rejected: { label: "REJEITADA", cls: "border-tango-red text-tango-red" },
};

export function CorrectionsClient({ initial }: { initial: Correction[] }) {
  const supabase = createClient();
  const [corrections, setCorrections] = useState<Correction[]>(initial);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = corrections.filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return c.status === "open" || c.status === "in_review";
    return c.status === "applied" || c.status === "rejected";
  });

  const updateStatus = async (id: string, status: "applied" | "rejected") => {
    setProcessing(id);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("correction_requests")
      .update({
        status,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    setProcessing(null);
    if (error) {
      setError(error.message);
      return;
    }
    setCorrections((cs) => cs.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const remove = async (id: string) => {
    if (!confirm("Deletar essa solicitação?")) return;
    const { error } = await supabase.from("correction_requests").delete().eq("id", id);
    if (error) return setError(error.message);
    setCorrections((cs) => cs.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="tg-mono text-[11px] uppercase tracking-wider border border-tango-red text-tango-red px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tg-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 transition-colors ${
              filter === f
                ? "border-tango-yellow text-tango-yellow bg-tango-yellow/10"
                : "border-tango-border text-tango-muted hover:text-tango-white"
            }`}
          >
            {f === "open" ? "PENDENTES" : f === "resolved" ? "RESOLVIDAS" : "TODAS"}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-tango-charcoal border border-tango-border py-16 text-center">
          <p className="tg-mono text-[11px] uppercase tracking-widest text-tango-muted">
            {filter === "open" ? "NENHUMA CORREÇÃO PENDENTE" : "SEM DADOS"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((c) => {
          const st = STATUS_LABELS[c.status] ?? STATUS_LABELS.open;
          const isOpen = c.status === "open" || c.status === "in_review";
          return (
            <div key={c.id} className="bg-tango-charcoal border border-tango-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted">
                      {TYPE_LABELS[c.report_type] ?? c.report_type}
                    </span>
                    <span className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted border border-tango-border px-1.5 py-0.5">
                      {c.reported_via === "telegram" ? "TELEGRAM" : "APP"}
                    </span>
                  </div>
                  {c.invoices && (
                    <p className="tg-display text-lg tracking-tight">
                      {c.invoices.suppliers?.name?.replace(/_/g, " ")} — Nota{" "}
                      <span className="text-tango-yellow">{c.invoices.invoice_number}</span>
                    </p>
                  )}
                  <p className="tg-mono text-[11px] text-tango-muted mt-0.5">
                    Reportado em {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                {isOpen && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(c.id, "applied")}
                      disabled={processing === c.id}
                      className="tg-mono text-[10px] uppercase tracking-widest border border-green-500 text-green-500 hover:bg-green-500/10 px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Check size={12} /> APLICAR
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, "rejected")}
                      disabled={processing === c.id}
                      className="tg-mono text-[10px] uppercase tracking-widest border border-tango-red text-tango-red hover:bg-tango-red/10 px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <X size={12} /> REJEITAR
                    </button>
                  </div>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="text-tango-muted hover:text-tango-red p-1"
                  title="Deletar"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-tango-border">
                <div>
                  <p className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-1">
                    VALOR ATUAL
                  </p>
                  <p className="text-tango-white text-sm">{c.current_value || "—"}</p>
                </div>
                <div>
                  <p className="tg-mono text-[9px] uppercase tracking-widest text-tango-yellow mb-1">
                    CORRETO
                  </p>
                  <p className="text-tango-yellow text-sm font-bold">{c.suggested_value || "—"}</p>
                </div>
              </div>

              {c.notes && (
                <div className="mt-3 pt-3 border-t border-tango-border">
                  <p className="tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-1">
                    OBSERVAÇÕES
                  </p>
                  <p className="text-tango-muted text-sm">{c.notes}</p>
                </div>
              )}

              {c.status !== "open" && c.resolved_at && (
                <div className="mt-3 pt-3 border-t border-tango-border tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
                  RESOLVIDA EM {new Date(c.resolved_at).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

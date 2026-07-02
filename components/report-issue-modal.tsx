"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  supplier: string;
  currentDate: string;
  currentTotal: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const TYPES = [
  { key: "date", label_pt: "DATA", label_en: "DATE", label_es: "FECHA" },
  { key: "supplier", label_pt: "FORNECEDOR", label_en: "SUPPLIER", label_es: "PROVEEDOR" },
  { key: "amount", label_pt: "VALOR", label_en: "AMOUNT", label_es: "VALOR" },
  { key: "classification", label_pt: "CLASSIFICAÇÃO", label_en: "CLASSIFICATION", label_es: "CLASIFICACIÓN" },
  { key: "missing", label_pt: "ITEM FALTANDO", label_en: "MISSING ITEM", label_es: "ÍTEM FALTANTE" },
  { key: "other", label_pt: "OUTRO", label_en: "OTHER", label_es: "OTRO" },
];

export function ReportIssueModal({
  invoiceId,
  invoiceNumber,
  supplier,
  currentDate,
  currentTotal,
  onClose,
  onSuccess,
}: Props) {
  const supabase = createClient();
  const [type, setType] = useState<string>("date");
  const [current, setCurrent] = useState("");
  const [suggested, setSuggested] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultCurrentFor = (t: string) => {
    if (t === "date") return currentDate;
    if (t === "supplier") return supplier;
    if (t === "amount") return currentTotal.toFixed(2);
    return "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Não autenticado");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from("correction_requests")
      .insert({
        organization_id: ORG_ID,
        invoice_id: invoiceId,
        reported_by: user.id,
        reported_via: "dashboard",
        report_type: type,
        current_value: current || defaultCurrentFor(type),
        suggested_value: suggested,
        notes: notes || null,
      });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
      <div className="w-full max-w-lg bg-tango-charcoal border border-tango-yellow relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-tango-border">
          <div>
            <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
              REPORTAR ERRO
            </p>
            <h2 className="tg-display text-xl mt-1 tracking-tight">
              Nota <span className="text-tango-yellow">{invoiceNumber}</span>
            </h2>
            <p className="tg-mono text-[11px] text-tango-muted mt-1">
              {supplier.replace(/_/g, " ")} · {currentDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-tango-muted hover:text-tango-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="tg-display text-tango-yellow text-2xl mb-2">✓</div>
            <p className="tg-mono text-[11px] uppercase tracking-widest text-tango-white">
              Correção enviada
            </p>
            <p className="text-tango-muted text-sm mt-2">
              Um admin vai revisar sua solicitação.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                O QUE ESTÁ ERRADO?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setType(t.key);
                      setCurrent("");
                    }}
                    className={`tg-mono text-[10px] uppercase tracking-widest border px-2 py-2 transition-colors ${
                      type === t.key
                        ? "border-tango-yellow text-tango-yellow bg-tango-yellow/10"
                        : "border-tango-border text-tango-muted hover:text-tango-white"
                    }`}
                  >
                    {t.label_pt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                VALOR ATUAL (como está)
              </label>
              <Input
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder={defaultCurrentFor(type) || "—"}
              />
            </div>

            <div>
              <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                VALOR CORRETO (deveria ser)
              </label>
              <Input
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
                placeholder={
                  type === "date"
                    ? "2026-05-28"
                    : type === "amount"
                    ? "$3150.80"
                    : type === "supplier"
                    ? "BRAZIL_USA"
                    : "..."
                }
                required
              />
            </div>

            <div>
              <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                OBSERVAÇÕES (OPCIONAL)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexto adicional pro admin"
                rows={2}
                className="w-full bg-tango-charcoal border border-tango-border px-4 py-2.5 text-sm text-tango-white placeholder:text-tango-muted font-medium focus:outline-none focus:border-tango-yellow resize-none"
              />
            </div>

            {error && (
              <div className="tg-mono text-[10px] uppercase tracking-wider border border-tango-red text-tango-red px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "..." : "ENVIAR →"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

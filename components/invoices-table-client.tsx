"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Eye, Trash2, AlertTriangle, X } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { ReportIssueModal } from "@/components/report-issue-modal";
import { createClient } from "@/lib/supabase/client";
import { canApplyCorrections, type UserRole } from "@/lib/permissions";

interface Invoice {
  id: string;
  number: string;
  date: string;
  supplier: string;
  payment: string | null;
  total: number;
  cmvTotal: number;
  items: number;
  receiptUrl?: string | null;
}

export function InvoicesTableClient({
  invoices,
  userRole,
}: {
  invoices: Invoice[];
  userRole?: UserRole;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [reportOpen, setReportOpen] = useState<Invoice | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = canApplyCorrections(userRole);

  const doDelete = async () => {
    if (!deleteOpen) return;
    setDeleting(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("invoices")
        .delete()
        .eq("id", deleteOpen.id);
      if (err) throw err;
      setDeleteOpen(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-tango-charcoal border border-tango-border">
      <div className="flex items-center justify-between px-6 py-5 border-b border-tango-border">
        <h3 className="tg-display uppercase tracking-wider text-sm">NOTAS DA SEMANA</h3>
        <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
          {invoices.length} notas
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tango-border">
              <Th>DATA</Th>
              <Th>FORNECEDOR</Th>
              <Th>Nº NOTA</Th>
              <Th>PAGAMENTO</Th>
              <Th className="text-right">ITEMS</Th>
              <Th className="text-right">CMV</Th>
              <Th className="text-right">TOTAL</Th>
              <Th className="text-center">AÇÕES</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-tango-border/40 hover:bg-tango-panel transition-colors"
              >
                <td className="px-6 py-3 tg-mono text-xs text-tango-muted">{inv.date}</td>
                <td className="px-6 py-3 tg-display uppercase tracking-wider text-sm">
                  {inv.supplier.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-3 tg-mono text-xs">{inv.number}</td>
                <td className="px-6 py-3">
                  {inv.payment && (
                    <span className="tg-mono text-[9px] uppercase tracking-widest border border-tango-border text-tango-muted px-2 py-0.5">
                      {inv.payment}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 tg-mono text-xs text-right">{inv.items}</td>
                <td className="px-6 py-3 tg-mono text-xs text-right text-tango-yellow font-bold">
                  {formatUSD(inv.cmvTotal)}
                </td>
                <td className="px-6 py-3 tg-mono text-xs text-right font-bold">
                  {formatUSD(inv.total)}
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    {inv.receiptUrl && (
                      <a
                        href={inv.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-yellow transition-colors inline-flex items-center gap-1.5 border border-tango-border hover:border-tango-yellow px-2.5 py-1"
                        title="Ver imagem original da nota"
                      >
                        <Eye size={11} />
                        VER
                      </a>
                    )}
                    <button
                      onClick={() => setReportOpen(inv)}
                      className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-red transition-colors inline-flex items-center gap-1.5 border border-tango-border hover:border-tango-red px-2.5 py-1"
                      title="Reportar erro nessa nota"
                    >
                      <Flag size={11} />
                      REPORTAR
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteOpen(inv)}
                        className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-red transition-colors inline-flex items-center gap-1.5 border border-tango-border hover:border-tango-red px-2.5 py-1"
                        title="Excluir essa nota (permite substituir por outra)"
                      >
                        <Trash2 size={11} />
                        EXCLUIR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reportOpen && (
        <ReportIssueModal
          invoiceId={reportOpen.id}
          invoiceNumber={reportOpen.number}
          supplier={reportOpen.supplier}
          currentDate={reportOpen.date}
          currentTotal={reportOpen.total}
          onClose={() => setReportOpen(null)}
        />
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
          onClick={() => !deleting && setDeleteOpen(null)}
        >
          <div
            className="bg-tango-charcoal border border-tango-border w-full sm:max-w-md sm:mx-4 p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !deleting && setDeleteOpen(null)}
              className="absolute top-4 right-4 text-tango-muted hover:text-tango-white transition-colors"
              disabled={deleting}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle
                size={28}
                className="text-tango-red flex-shrink-0 mt-1"
              />
              <div>
                <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-red mb-2">
                  ATENÇÃO · EXCLUIR NOTA
                </p>
                <h2 className="tg-display text-xl sm:text-2xl tracking-tight">
                  Confirma exclusão?
                </h2>
              </div>
            </div>

            <div className="border border-tango-border p-4 mb-5 space-y-2 tg-mono text-xs">
              <div className="flex justify-between">
                <span className="text-tango-muted uppercase tracking-widest">Fornecedor</span>
                <span className="text-tango-white font-bold">
                  {deleteOpen.supplier.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tango-muted uppercase tracking-widest">Nº Nota</span>
                <span className="text-tango-yellow font-bold">{deleteOpen.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tango-muted uppercase tracking-widest">Data</span>
                <span className="text-tango-white">{deleteOpen.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tango-muted uppercase tracking-widest">Total</span>
                <span className="text-tango-white font-bold">{formatUSD(deleteOpen.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tango-muted uppercase tracking-widest">Items</span>
                <span className="text-tango-white">{deleteOpen.items}</span>
              </div>
            </div>

            <p className="text-tango-muted text-sm mb-5">
              Todos os itens e correções vinculadas a essa nota serão removidos.
              Depois de excluir você pode reenviar a nota corrigida pelo Telegram
              ou upload.
            </p>

            {error && (
              <div className="tg-mono text-[11px] uppercase tracking-wider border border-tango-red text-tango-red px-3 py-2.5 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(null)}
                disabled={deleting}
                className="flex-1 tg-mono text-[10px] uppercase tracking-widest font-bold border border-tango-border text-tango-muted hover:text-tango-white hover:border-tango-white px-4 py-3 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={deleting}
                className="flex-1 tg-mono text-[10px] uppercase tracking-widest font-bold bg-tango-red text-tango-white hover:bg-tango-red/90 px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Trash2 size={12} />
                {deleting ? "EXCLUINDO…" : "SIM, EXCLUIR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`tg-mono text-[9px] uppercase tracking-widest3 text-tango-muted font-bold text-left px-6 py-3 ${className}`}
    >
      {children}
    </th>
  );
}

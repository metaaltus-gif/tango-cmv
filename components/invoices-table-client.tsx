"use client";

import { useState } from "react";
import { Flag, Eye } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { ReportIssueModal } from "@/components/report-issue-modal";

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

export function InvoicesTableClient({ invoices }: { invoices: Invoice[] }) {
  const [reportOpen, setReportOpen] = useState<Invoice | null>(null);

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

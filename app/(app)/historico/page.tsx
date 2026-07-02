import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatUSD, getWeekStart, isoDate } from "@/lib/utils";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");
const META = 15000;

export const dynamic = "force-dynamic";

async function fetchHistory() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(
      "total_price, is_cmv, quantity, unit, subcategory, invoice_id, invoices!inner(invoice_date, organization_id)"
    )
    .eq("invoices.organization_id", ORG_ID)
    .order("invoices(invoice_date)", { ascending: false });

  if (error) {
    console.error("history fetch error", error);
    return [];
  }

  const byWeek = new Map<
    string,
    { cmv: number; nonCmv: number; invoices: Set<string>; salmonLbs: number; salmonUsd: number }
  >();

  for (const it of data ?? []) {
    const inv: any = it.invoices;
    if (!inv?.invoice_date) continue;
    const d = new Date(inv.invoice_date);
    const ws = isoDate(getWeekStart(d));
    if (!byWeek.has(ws))
      byWeek.set(ws, { cmv: 0, nonCmv: 0, invoices: new Set(), salmonLbs: 0, salmonUsd: 0 });
    const wk = byWeek.get(ws)!;
    const tp = Number(it.total_price) || 0;
    if (it.is_cmv) wk.cmv += tp;
    else wk.nonCmv += tp;
    if (it.subcategory === "Salmon" && it.unit === "lb") {
      wk.salmonLbs += Number(it.quantity) || 0;
      wk.salmonUsd += tp;
    }
    wk.invoices.add(it.invoice_id);
  }

  return Array.from(byWeek.entries())
    .map(([weekStart, v]) => ({ weekStart, ...v }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

export default async function HistoricoPage() {
  const weeks = await fetchHistory();

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          HISTÓRICO · TODAS AS SEMANAS
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>

      <div className="mb-6">
        <h1 className="tg-display text-4xl tracking-tight mb-2">
          {weeks.length} <span className="text-tango-yellow">semanas</span> processadas
        </h1>
        <p className="text-tango-muted text-sm">
          Clique numa linha pra ver detalhes, notas e downloads da semana.
        </p>
      </div>

      <section className="bg-tango-charcoal border border-tango-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tango-border">
                <Th>SEMANA</Th>
                <Th className="text-right">CMV</Th>
                <Th className="text-right">NÃO-CMV</Th>
                <Th className="text-right">SALMÃO LBS</Th>
                <Th className="text-right">$/LB</Th>
                <Th className="text-right">NOTAS</Th>
                <Th className="text-center">STATUS</Th>
                <Th className="text-right">→</Th>
              </tr>
            </thead>
            <tbody>
              {weeks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 tg-mono text-[11px] uppercase tracking-widest text-tango-muted">
                    SEM DADOS
                  </td>
                </tr>
              )}
              {weeks.map((w, idx) => {
                const over = w.cmv > META;
                const pricePerLb = w.salmonLbs > 0 ? w.salmonUsd / w.salmonLbs : 0;
                return (
                  <tr
                    key={w.weekStart}
                    className="border-b border-tango-border/40 hover:bg-tango-panel transition-colors cursor-pointer group"
                  >
                    <Td>
                      <Link
                        href={`/historico/${w.weekStart}`}
                        className="flex items-center gap-3 -m-3 p-3"
                      >
                        <span className="tg-mono text-[10px] text-tango-yellow">
                          {String(weeks.length - idx).padStart(2, "0")}
                        </span>
                        <span className="tg-display uppercase tracking-wider text-sm group-hover:text-tango-yellow transition-colors">
                          {w.weekStart}
                        </span>
                      </Link>
                    </Td>
                    <TdLink week={w.weekStart} className="text-right tg-mono text-sm font-bold">{formatUSD(w.cmv)}</TdLink>
                    <TdLink week={w.weekStart} className="text-right tg-mono text-sm text-tango-muted">
                      {formatUSD(w.nonCmv)}
                    </TdLink>
                    <TdLink week={w.weekStart} className="text-right tg-mono text-sm">
                      {w.salmonLbs > 0 ? w.salmonLbs.toFixed(2) : "—"}
                    </TdLink>
                    <TdLink week={w.weekStart} className="text-right tg-mono text-sm">
                      {pricePerLb > 0 ? `$${pricePerLb.toFixed(2)}` : "—"}
                    </TdLink>
                    <TdLink week={w.weekStart} className="text-right tg-mono text-sm">{w.invoices.size}</TdLink>
                    <TdLink week={w.weekStart} className="text-center">
                      <span
                        className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${
                          over
                            ? "border-tango-red text-tango-red"
                            : "border-tango-yellow text-tango-yellow"
                        }`}
                      >
                        {over ? "ACIMA" : "DENTRO"}
                      </span>
                    </TdLink>
                    <TdLink week={w.weekStart} className="text-right text-tango-muted group-hover:text-tango-yellow transition-colors tg-display text-lg">
                      →
                    </TdLink>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
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
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-3 align-middle ${className}`}>{children}</td>;
}
function TdLink({ children, week, className = "" }: { children: React.ReactNode; week: string; className?: string }) {
  return (
    <td className={`align-middle ${className}`}>
      <Link href={`/historico/${week}`} className="block px-6 py-3 -m-0">
        {children}
      </Link>
    </td>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatUSD, isoDate, formatWeekRange } from "@/lib/utils";
import { InvoicesTableClient } from "@/components/invoices-table-client";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");
const META = 15000;

export const dynamic = "force-dynamic";

interface Props {
  params: { week: string };
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

async function fetchWeekDetail(weekStart: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return null;

  const supabase = createClient();
  const startDate = new Date(weekStart + "T00:00:00Z");
  const endDate = addDays(startDate, 6);

  const { data: items, error } = await supabase
    .from("items")
    .select(
      "id, total_price, is_cmv, quantity, unit, subcategory, category, description, product_type, invoice_id, invoices!inner(id, invoice_number, invoice_date, payment_method, organization_id, suppliers(name))"
    )
    .eq("invoices.organization_id", ORG_ID)
    .gte("invoices.invoice_date", isoDate(startDate))
    .lte("invoices.invoice_date", isoDate(endDate))
    .order("invoices(invoice_date)", { ascending: true });

  if (error) {
    console.error("week detail error", error);
    return null;
  }

  const invoicesMap = new Map<
    string,
    {
      id: string;
      number: string;
      date: string;
      supplier: string;
      payment: string | null;
      total: number;
      cmvTotal: number;
      items: number;
      salmonLbs: number;
      salmonUsd: number;
    }
  >();
  const bySupplier = new Map<string, number>();
  let cmv = 0;
  let nonCmv = 0;
  let salmonLbs = 0;
  let salmonUsd = 0;

  for (const it of items ?? []) {
    const inv: any = it.invoices;
    const tp = Number(it.total_price) || 0;
    if (it.is_cmv) cmv += tp;
    else nonCmv += tp;
    if (it.subcategory === "Salmon" && it.unit === "lb") {
      salmonLbs += Number(it.quantity) || 0;
      salmonUsd += tp;
    }

    if (!invoicesMap.has(inv.id)) {
      invoicesMap.set(inv.id, {
        id: inv.id,
        number: inv.invoice_number,
        date: inv.invoice_date,
        supplier: inv.suppliers?.name || "?",
        payment: inv.payment_method,
        total: 0,
        cmvTotal: 0,
        items: 0,
        salmonLbs: 0,
        salmonUsd: 0,
      });
    }
    const invRow = invoicesMap.get(inv.id)!;
    invRow.total += tp;
    if (it.is_cmv) invRow.cmvTotal += tp;
    invRow.items += 1;
    if (it.subcategory === "Salmon" && it.unit === "lb") {
      invRow.salmonLbs += Number(it.quantity) || 0;
      invRow.salmonUsd += tp;
    }

    if (it.is_cmv) {
      const sn = inv.suppliers?.name || "?";
      bySupplier.set(sn, (bySupplier.get(sn) || 0) + tp);
    }
  }

  const invoices = Array.from(invoicesMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const suppliers = Array.from(bySupplier.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    weekStart,
    weekEnd: isoDate(endDate),
    cmv,
    nonCmv,
    salmonLbs,
    salmonUsd,
    invoices,
    suppliers,
    totalItems: items?.length ?? 0,
  };
}

export default async function WeekDetailPage({ params }: Props) {
  const data = await fetchWeekDetail(params.week);
  if (!data) notFound();

  const dif = META - data.cmv;
  const over = data.cmv > META;
  const supTotal = data.suppliers.reduce((a, s) => a + s.total, 0);
  const maxSup = data.suppliers[0]?.total || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/historico"
          className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted hover:text-tango-yellow transition-colors"
        >
          ← HISTÓRICO
        </Link>
        <span className="text-tango-border">/</span>
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          SEMANA {formatWeekRange(data.weekStart, "pt")}
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>

      <div className="bg-tango-charcoal border border-tango-border p-8 lg:p-10 relative tg-card-line">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <p className="tg-eyebrow mb-4">TOTAL DA SEMANA</p>
            <div className="tg-display text-6xl lg:text-8xl leading-none tracking-tight text-tango-white">
              {formatUSD(data.cmv).split(".")[0]}
              <span className="text-tango-yellow text-3xl lg:text-5xl">
                .{formatUSD(data.cmv).split(".")[1] ?? "00"}
              </span>
            </div>
            <div className="tg-mono text-xs text-tango-muted mt-6 flex items-center gap-2 flex-wrap tracking-wider">
              <span className="text-tango-white font-bold">${META.toLocaleString()}</span>
              <span className="text-tango-yellow text-base font-bold px-1">−</span>
              <span className="text-tango-white font-bold">{formatUSD(data.cmv)}</span>
              <span className="text-tango-yellow text-base font-bold px-1">=</span>
              <span
                className={`font-bold uppercase tracking-widest px-2.5 py-1 border ${
                  over ? "border-tango-red text-tango-red" : "border-tango-yellow text-tango-yellow"
                }`}
              >
                {formatUSD(Math.abs(dif))} {over ? "ACIMA" : "ABAIXO"}
              </span>
            </div>
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-tango-border lg:pl-8 pt-6 lg:pt-0 space-y-5">
            <div>
              <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-muted mb-1.5">notas</p>
              <p className="tg-display text-2xl tracking-tight leading-none">{data.invoices.length}</p>
              <p className="tg-mono text-xs text-tango-muted mt-1">{data.totalItems} items</p>
            </div>
            <div>
              <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-muted mb-1.5">salmão</p>
              <p className="tg-display text-2xl tracking-tight leading-none">
                {data.salmonLbs.toFixed(0)} <span className="text-tango-muted text-base">lbs</span>
              </p>
              <p className="tg-mono text-xs text-tango-muted mt-1">
                {data.salmonLbs > 0 ? `@ $${(data.salmonUsd / data.salmonLbs).toFixed(2)}/lb` : "—"}
              </p>
            </div>
            <div>
              <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-muted mb-1.5">não-CMV</p>
              <p className="tg-display text-2xl tracking-tight leading-none text-tango-muted">
                {formatUSD(data.nonCmv)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-tango-charcoal border border-tango-border p-6 lg:p-7">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-tango-border">
          <div>
            <h3 className="tg-display uppercase tracking-wider text-sm">DOWNLOADS DESTA SEMANA</h3>
            <p className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted mt-1">
              MESMO FORMATO PYTHON · GERADO SOB DEMANDA
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href={`/api/reports/xlsx?week=${data.weekStart}`}
            className="border border-tango-border p-5 hover:border-tango-yellow hover:bg-tango-panel transition-colors group"
          >
            <div className="tg-mono text-[10px] uppercase tracking-widest text-tango-yellow mb-2">
              01 — EXCEL SEMANAL
            </div>
            <div className="tg-display text-lg group-hover:text-tango-yellow">Baixar .xlsx →</div>
            <p className="tg-mono text-[11px] text-tango-muted mt-2">
              CMV_CONTROL formato v36
            </p>
          </a>
          <a
            href={`/api/reports/pdf?week=${data.weekStart}`}
            className="border border-tango-border p-5 hover:border-tango-red hover:bg-tango-panel transition-colors group"
          >
            <div className="tg-mono text-[10px] uppercase tracking-widest text-tango-red mb-2">
              02 — PDF DA SEMANA
            </div>
            <div className="tg-display text-lg group-hover:text-tango-red">Baixar .pdf →</div>
            <p className="tg-mono text-[11px] text-tango-muted mt-2">
              Snapshot da aba SEMANA
            </p>
          </a>
        </div>
      </div>

      {data.suppliers.length > 0 && (
        <div className="bg-tango-charcoal border border-tango-border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-tango-border">
            <h3 className="tg-display uppercase tracking-wider text-sm">FORNECEDORES</h3>
            <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
              {formatUSD(supTotal)}
              {data.cmv ? ` · ${((supTotal / data.cmv) * 100).toFixed(0)}% do CMV` : ""}
            </span>
          </div>
          <div className="space-y-2">
            {data.suppliers.map((s, i) => (
              <div key={s.name} className="grid grid-cols-[120px_1fr_120px] gap-4 items-center py-2.5 border-b border-tango-border/50 last:border-b-0">
                <div className="tg-display uppercase tracking-wider text-[13px]">
                  {s.name.replace(/_/g, " ")}
                </div>
                <div className="h-1.5 bg-tango-black border border-tango-border relative">
                  <div
                    className={`h-full ${i < 2 ? "bg-tango-yellow" : "bg-tango-muted"}`}
                    style={{ width: `${Math.min((s.total / maxSup) * 100, 100)}%` }}
                  />
                </div>
                <div className="tg-mono text-right text-xs font-bold">{formatUSD(s.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <InvoicesTableClient invoices={data.invoices} />
    </div>
  );
}

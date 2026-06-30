import { createClient } from "@/lib/supabase/server";
import { CmvChart } from "@/components/cmv-chart";
import { formatUSD, getWeekStart, isoDate } from "@/lib/utils";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");
const META = 15000;

export const dynamic = "force-dynamic";

async function fetchData() {
  const supabase = createClient();
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const since = new Date(currentWeekStart);
  since.setUTCDate(since.getUTCDate() - 7 * 7);

  const { data: items, error } = await supabase
    .from("items")
    .select(
      "total_price, is_cmv, quantity, unit, subcategory, invoice_id, invoices!inner(invoice_date, organization_id, suppliers(name))"
    )
    .gte("invoices.invoice_date", isoDate(since))
    .eq("invoices.organization_id", ORG_ID);

  if (error) {
    console.error("dashboard fetch error", error);
    return { weeks: [], current: null, suppliers: [] };
  }

  const byWeek = new Map<
    string,
    {
      weekStart: string;
      cmv: number;
      nonCmv: number;
      salmonLbs: number;
      salmonUsd: number;
      invoices: Set<string>;
    }
  >();
  const supTotals = new Map<string, number>();

  for (const it of items ?? []) {
    const inv: any = it.invoices;
    if (!inv?.invoice_date) continue;
    const d = new Date(inv.invoice_date);
    const ws = getWeekStart(d);
    const key = isoDate(ws);
    if (!byWeek.has(key)) {
      byWeek.set(key, {
        weekStart: key,
        cmv: 0,
        nonCmv: 0,
        salmonLbs: 0,
        salmonUsd: 0,
        invoices: new Set(),
      });
    }
    const wk = byWeek.get(key)!;
    const tp = Number(it.total_price) || 0;
    if (it.is_cmv) wk.cmv += tp;
    else wk.nonCmv += tp;
    if (it.subcategory === "Salmon" && it.unit === "lb") {
      wk.salmonLbs += Number(it.quantity) || 0;
      wk.salmonUsd += tp;
    }
    wk.invoices.add(it.invoice_id);

    // Sum supplier totals only for current week
    if (isoDate(ws) === isoDate(currentWeekStart)) {
      const sn = inv.suppliers?.name || "DESCONHECIDO";
      if (it.is_cmv) supTotals.set(sn, (supTotals.get(sn) || 0) + tp);
    }
  }

  const weeks = Array.from(byWeek.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  );
  const currentKey = isoDate(currentWeekStart);
  const current = weeks.find((w) => w.weekStart === currentKey) ?? null;

  const suppliers = Array.from(supTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return { weeks, current, suppliers };
}

export default async function DashboardPage() {
  const { weeks, current, suppliers } = await fetchData();
  const last = current ?? weeks[weeks.length - 1] ?? null;

  const chartData = weeks.map((w) => ({
    week: w.weekStart.slice(5).replace("-", "/"),
    cmv: Math.round(w.cmv * 100) / 100,
    meta: META,
  }));

  const cmvTotal = last?.cmv ?? 0;
  const dif = META - cmvTotal;
  const isOver = cmvTotal > META;
  const supTotal = suppliers.reduce((acc, s) => acc + s.total, 0);
  const maxSup = suppliers[0]?.total || 1;

  const weekLabel = last
    ? `${last.weekStart.slice(8)}—${parseInt(last.weekStart.slice(8)) + 6} ${
        ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"][
          parseInt(last.weekStart.slice(5, 7)) - 1
        ]
      }`
    : "—";

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-4">
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          CMV · SEMANA {weekLabel}
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>

      {/* Hero */}
      <div className="bg-tango-charcoal border border-tango-border p-8 lg:p-10 relative tg-card-line">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <p className="tg-eyebrow mb-4">TOTAL DA SEMANA</p>
            <div className="tg-display text-6xl lg:text-8xl leading-none tracking-tight text-tango-white">
              {formatUSD(cmvTotal).split(".")[0]}
              <span className="text-tango-yellow text-3xl lg:text-5xl">
                .{formatUSD(cmvTotal).split(".")[1] ?? "00"}
              </span>
            </div>
            <div className="tg-mono text-xs text-tango-muted mt-6 flex items-center gap-2 flex-wrap tracking-wider">
              <span className="text-tango-white font-bold">${META.toLocaleString()}</span>
              <span className="text-tango-yellow text-base font-bold px-1">−</span>
              <span className="text-tango-white font-bold">{formatUSD(cmvTotal)}</span>
              <span className="text-tango-yellow text-base font-bold px-1">=</span>
              <span
                className={`font-bold uppercase tracking-widest px-2.5 py-1 border ${
                  isOver ? "border-tango-red text-tango-red" : "border-tango-yellow text-tango-yellow"
                }`}
              >
                {formatUSD(Math.abs(dif))} {isOver ? "ACIMA" : "ABAIXO"}
              </span>
            </div>
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-tango-border lg:pl-8 pt-6 lg:pt-0 space-y-5">
            <SideStat
              label="salmão · lbs"
              value={`${(last?.salmonLbs ?? 0).toFixed(0)}`}
              sub={
                last?.salmonLbs
                  ? `@ $${(last.salmonUsd / last.salmonLbs).toFixed(2)}/lb`
                  : undefined
              }
            />
            <SideStat
              label="notas processadas"
              value={`${last?.invoices.size ?? 0}`}
              sub="esta semana"
            />
            <SideStat
              label="margem da meta"
              value={`${cmvTotal ? ((Math.abs(dif) / META) * 100).toFixed(1) : 0}%`}
              valueColor={isOver ? "text-tango-red" : "text-tango-yellow"}
              sub={isOver ? "↑ acima do limite" : "↓ dentro do limite"}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-tango-border bg-tango-border gap-px">
        <StatBox num="01 — SALMÃO" value={formatUSD(last?.salmonUsd ?? 0)} sub={cmvTotal ? `${(((last?.salmonUsd ?? 0) / cmvTotal) * 100).toFixed(0)}% do CMV` : "—"} />
        <StatBox num="02 — TOTAL FORNECEDORES" value={formatUSD(supTotal)} sub={`top 5 da semana`} />
        <StatBox
          num="03 — STATUS"
          value={isOver ? "↑ ACIMA" : "↓ DENTRO"}
          valueColor={isOver ? "text-tango-red" : "text-tango-yellow"}
          sub={isOver ? "atenção" : "dentro da meta"}
          danger={isOver}
        />
      </div>

      {/* Chart */}
      <div className="bg-tango-charcoal border border-tango-border p-6 lg:p-8">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-tango-border">
          <h3 className="tg-display uppercase tracking-wider text-sm">CMV — ÚLTIMAS 8 SEMANAS</h3>
          <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
            META · ${META.toLocaleString()}
          </span>
        </div>
        <CmvChart data={chartData} />
      </div>

      {/* Suppliers */}
      <div className="bg-tango-charcoal border border-tango-border p-6 lg:p-8">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-tango-border">
          <h3 className="tg-display uppercase tracking-wider text-sm">FORNECEDORES — TOP 5</h3>
          <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
            {formatUSD(supTotal)}
            {cmvTotal ? ` · ${((supTotal / cmvTotal) * 100).toFixed(0)}% do total` : ""}
          </span>
        </div>
        <div className="space-y-2">
          {suppliers.length === 0 && (
            <p className="tg-mono text-xs text-tango-muted py-6 text-center uppercase tracking-widest">
              SEM DADOS NA SEMANA ATUAL
            </p>
          )}
          {suppliers.map((s, i) => (
            <SupplierRow
              key={s.name}
              name={s.name}
              amount={s.total}
              pct={(s.total / maxSup) * 100}
              isTop={i < 2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SideStat({
  label,
  value,
  sub,
  valueColor = "text-tango-white",
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-muted mb-1.5">
        {label}
      </p>
      <p className={`tg-display text-2xl tracking-tight leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="tg-mono text-xs text-tango-muted mt-1">{sub}</p>}
    </div>
  );
}

function StatBox({
  num,
  value,
  sub,
  valueColor = "text-tango-white",
  danger = false,
}: {
  num: string;
  value: string;
  sub: string;
  valueColor?: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-tango-charcoal p-6 lg:p-7 tg-card-line ${danger ? "danger" : ""}`}
    >
      <p
        className={`tg-mono text-[10px] uppercase tracking-widest3 mb-3 ${
          danger ? "text-tango-red" : "text-tango-yellow"
        }`}
      >
        {num}
      </p>
      <p className={`tg-display text-3xl lg:text-4xl leading-none tracking-tight ${valueColor}`}>
        {value}
      </p>
      <p className="tg-mono text-[11px] uppercase tracking-wider text-tango-muted mt-2">{sub}</p>
    </div>
  );
}

function SupplierRow({
  name,
  amount,
  pct,
  isTop,
}: {
  name: string;
  amount: number;
  pct: number;
  isTop: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr_120px] gap-4 items-center py-2.5 border-b border-tango-border/50 last:border-b-0">
      <div className="tg-display uppercase tracking-wider text-[13px]">{name.replace(/_/g, " ")}</div>
      <div className="h-1.5 bg-tango-black border border-tango-border relative">
        <div
          className={`h-full ${isTop ? "bg-tango-yellow" : "bg-tango-muted"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="tg-mono text-right text-xs font-bold">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}
      </div>
    </div>
  );
}

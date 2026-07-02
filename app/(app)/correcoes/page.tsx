import { createClient } from "@/lib/supabase/server";
import { CorrectionsClient } from "./corrections-client";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");

export const dynamic = "force-dynamic";

async function fetchAll() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: corrections } = await supabase
    .from("correction_requests")
    .select(
      "id, invoice_id, reported_by, reported_via, report_type, current_value, suggested_value, notes, status, resolved_by, resolved_at, resolution_notes, created_at, invoices(invoice_number, invoice_date, suppliers(name))"
    )
    .eq("organization_id", ORG_ID)
    .order("created_at", { ascending: false });

  return { corrections: corrections ?? [], role: profile?.role ?? null };
}

export default async function CorrecoesPage() {
  const { corrections, role } = await fetchAll();
  const openCount = corrections.filter((c: any) => c.status === "open").length;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          CORREÇÕES · REVISÃO
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>

      <div className="mb-6">
        <h1 className="tg-display text-4xl tracking-tight mb-2">
          {openCount} <span className="text-tango-yellow">pendente{openCount === 1 ? "" : "s"}</span>
        </h1>
        <p className="text-tango-muted text-sm">
          Solicitações reportadas via app e Telegram. Manager aprova → dados são atualizados.
        </p>
      </div>

      <CorrectionsClient initial={corrections as any} userRole={role as any} />
    </div>
  );
}

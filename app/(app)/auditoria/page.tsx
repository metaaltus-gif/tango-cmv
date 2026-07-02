import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/permissions";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  create: "CRIOU",
  update: "EDITOU",
  delete: "DELETOU",
  applied: "APLICOU CORREÇÃO",
  rejected: "REJEITOU CORREÇÃO",
  in_review: "MARCOU EM REVISÃO",
  open: "REABRIU",
};
const ENTITY_LABEL: Record<string, string> = {
  correction_requests: "correção",
  org_supplier_rules: "regra fornecedor",
  org_cmv_rules: "regra CMV",
  app_users: "usuário",
};

const ACTION_COLOR: Record<string, string> = {
  create: "border-tango-yellow text-tango-yellow",
  update: "border-tango-white text-tango-white",
  delete: "border-tango-red text-tango-red",
  applied: "border-green-500 text-green-500",
  rejected: "border-tango-red text-tango-red",
};

async function fetchLog() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("organization_id", ORG_ID)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("audit fetch error", error);
  return data ?? [];
}

export default async function AuditoriaPage() {
  const log = await fetchLog();

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          AUDITORIA · TRILHA DE AÇÕES
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>

      <div className="mb-6">
        <h1 className="tg-display text-4xl tracking-tight mb-2">
          {log.length} <span className="text-tango-yellow">ações</span> registradas
        </h1>
        <p className="text-tango-muted text-sm">
          Trilha completa de tudo que foi feito. Mostrando últimas 200.
        </p>
      </div>

      <section className="bg-tango-charcoal border border-tango-border">
        {log.length === 0 && (
          <div className="text-center py-16 tg-mono text-[11px] uppercase tracking-widest text-tango-muted">
            SEM AÇÕES REGISTRADAS
          </div>
        )}
        <div className="divide-y divide-tango-border">
          {log.map((row: any) => {
            const actionCls = ACTION_COLOR[row.action] ?? "border-tango-border text-tango-muted";
            return (
              <div key={row.id} className="px-6 py-4 hover:bg-tango-panel/60 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${actionCls}`}>
                    {ACTION_LABEL[row.action] ?? row.action}
                  </span>
                  <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
                    {ENTITY_LABEL[row.entity_type] ?? row.entity_type}
                  </span>
                  <span className="tg-mono text-[10px] text-tango-muted">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </span>
                  {row.via !== "app" && (
                    <span className="tg-mono text-[9px] uppercase tracking-widest border border-tango-border text-tango-muted px-1.5 py-0.5">
                      {row.via}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {row.actor_name && (
                    <div className="w-7 h-7 bg-tango-yellow text-tango-black flex items-center justify-center tg-display text-[12px] font-black">
                      {row.actor_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-tango-white text-sm font-bold">
                      {row.actor_name ?? "?"}
                    </span>
                    {row.actor_role && (
                      <span className="tg-mono text-[9px] uppercase tracking-widest text-tango-yellow ml-2">
                        {roleLabel(row.actor_role)}
                      </span>
                    )}
                    <span className="tg-mono text-[11px] text-tango-muted ml-3">
                      {row.entity_id?.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { RulesClient } from "./rules-client";
import type { SupplierRule, CmvRule } from "@/lib/types";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");

export const dynamic = "force-dynamic";

export default async function RegrasPage() {
  const supabase = createClient();

  const { data: supplierRules } = await supabase
    .from("org_supplier_rules")
    .select("*")
    .eq("organization_id", ORG_ID)
    .order("supplier_name");

  const { data: cmvRules } = await supabase
    .from("org_cmv_rules")
    .select("*")
    .eq("organization_id", ORG_ID)
    .order("category");

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <p className="tg-mono text-[10px] uppercase tracking-widest3 text-tango-yellow">
          REGRAS · CONFIGURAÇÃO
        </p>
        <div className="flex-1 h-px bg-tango-border" />
      </div>
      <div className="mb-6">
        <h1 className="tg-display text-4xl tracking-tight mb-2">
          Configuração de <span className="text-tango-yellow">regras</span>
        </h1>
        <p className="text-tango-muted text-sm max-w-2xl">
          Como cada fornecedor é classificado e o pagamento padrão.
          As mesmas regras valem no bot do Telegram.
        </p>
      </div>

      <RulesClient
        initialSupplierRules={(supplierRules ?? []) as SupplierRule[]}
        initialCmvRules={(cmvRules ?? []) as CmvRule[]}
      />
    </div>
  );
}

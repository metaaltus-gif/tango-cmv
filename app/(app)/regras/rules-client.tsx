"use client";

import { useState } from "react";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupplierRule, CmvRule, ClassificationMode } from "@/lib/types";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");
const PRODUCT_TYPES = ["FOOD", "SALMON", "DRINK", "OTHER", "SUPPLIES", "EQUIPMENT", "FURNITURE"];

export function RulesClient({
  initialSupplierRules,
  initialCmvRules,
}: {
  initialSupplierRules: SupplierRule[];
  initialCmvRules: CmvRule[];
}) {
  const supabase = createClient();
  const [supplierRules, setSupplierRules] = useState(initialSupplierRules);
  const [cmvRules, setCmvRules] = useState(initialCmvRules);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<SupplierRule>>({});
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<SupplierRule>>({
    supplier_name: "",
    classification_mode: "item_by_item",
    default_payment_method: "Net 30",
    supplies_count_as_cmv: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (rule: SupplierRule) => {
    setEditing(rule.id);
    setDraft({ ...rule });
    setError(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft({});
    setError(null);
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const updates: any = {
      classification_mode: draft.classification_mode,
      force_product_type: draft.force_product_type || null,
      allowed_product_types: draft.allowed_product_types || null,
      default_payment_method: draft.default_payment_method,
      supplies_count_as_cmv: draft.supplies_count_as_cmv,
      notes: draft.notes,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("org_supplier_rules")
      .update(updates)
      .eq("id", editing)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSupplierRules((rs) => rs.map((r) => (r.id === editing ? (data as SupplierRule) : r)));
    cancelEdit();
  };
  const addNew = async () => {
    if (!newRule.supplier_name) {
      setError("Nome do fornecedor é obrigatório");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: any = {
      organization_id: ORG_ID,
      supplier_name: newRule.supplier_name?.toUpperCase().replace(/ /g, "_"),
      classification_mode: newRule.classification_mode ?? "item_by_item",
      force_product_type: newRule.force_product_type || null,
      allowed_product_types: newRule.allowed_product_types || null,
      default_payment_method: newRule.default_payment_method ?? "Net 30",
      supplies_count_as_cmv: newRule.supplies_count_as_cmv ?? false,
      notes: newRule.notes ?? null,
    };
    const { data, error } = await supabase
      .from("org_supplier_rules")
      .insert(payload)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSupplierRules((rs) =>
      [...rs, data as SupplierRule].sort((a, b) => a.supplier_name.localeCompare(b.supplier_name))
    );
    setAdding(false);
    setNewRule({
      supplier_name: "",
      classification_mode: "item_by_item",
      default_payment_method: "Net 30",
      supplies_count_as_cmv: false,
    });
  };
  const remove = async (id: number) => {
    if (!confirm("Remover esta regra?")) return;
    const { error } = await supabase.from("org_supplier_rules").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setSupplierRules((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="tg-mono text-[11px] uppercase tracking-wider border border-tango-red text-tango-red px-4 py-3">
          {error}
        </div>
      )}

      {/* Supplier rules section */}
      <section className="bg-tango-charcoal border border-tango-border">
        <div className="flex items-center justify-between px-6 py-5 border-b border-tango-border">
          <div>
            <h2 className="tg-display uppercase tracking-wider text-sm mb-1">
              REGRAS POR FORNECEDOR
            </h2>
            <p className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
              {supplierRules.length} fornecedores configurados
            </p>
          </div>
          <Button onClick={() => setAdding(!adding)} variant={adding ? "secondary" : "primary"} size="sm">
            {adding ? "CANCELAR" : "+ ADICIONAR"}
          </Button>
        </div>

        {adding && (
          <div className="bg-tango-black border-b border-tango-border px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  NOME · EX: WALMART
                </label>
                <Input
                  value={newRule.supplier_name ?? ""}
                  onChange={(e) => setNewRule({ ...newRule, supplier_name: e.target.value })}
                  placeholder="WALMART"
                />
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  MODO
                </label>
                <select
                  value={newRule.classification_mode}
                  onChange={(e) =>
                    setNewRule({ ...newRule, classification_mode: e.target.value as ClassificationMode })
                  }
                  className="w-full bg-tango-charcoal border border-tango-border px-3 py-2.5 text-sm text-tango-white focus:outline-none focus:border-tango-yellow"
                >
                  <option value="item_by_item">ITEM POR ITEM</option>
                  <option value="force_all_to">TUDO VAI PRA UM TIPO</option>
                  <option value="allowed_split">SÓ PERMITE ALGUNS</option>
                </select>
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">
                  PAGAMENTO
                </label>
                <Input
                  value={newRule.default_payment_method ?? ""}
                  onChange={(e) =>
                    setNewRule({ ...newRule, default_payment_method: e.target.value })
                  }
                  placeholder="CHECK, ACH, etc"
                />
              </div>
              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="new_scc"
                  checked={newRule.supplies_count_as_cmv ?? false}
                  onChange={(e) =>
                    setNewRule({ ...newRule, supplies_count_as_cmv: e.target.checked })
                  }
                  className="w-4 h-4 accent-tango-yellow"
                />
                <label htmlFor="new_scc" className="ml-3 tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
                  SUPPLIES CONTAM COMO CMV
                </label>
              </div>
            </div>
            <Button onClick={addNew} disabled={saving} variant="primary" size="md">
              {saving ? "..." : "SALVAR REGRA"}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tango-border">
                <Th>FORNECEDOR</Th>
                <Th>MODO</Th>
                <Th>RESTRIÇÃO</Th>
                <Th>PAGAMENTO</Th>
                <Th className="text-center">SUPP=CMV</Th>
                <Th className="text-right">AÇÕES</Th>
              </tr>
            </thead>
            <tbody>
              {supplierRules.map((r, idx) => {
                const isEditing = editing === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-tango-border/40 hover:bg-tango-panel transition-colors`}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="tg-mono text-[10px] text-tango-yellow">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="tg-display uppercase tracking-wider text-sm">
                          {r.supplier_name.replace(/_/g, " ")}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      {isEditing ? (
                        <select
                          value={draft.classification_mode}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              classification_mode: e.target.value as ClassificationMode,
                            })
                          }
                          className="bg-tango-charcoal border border-tango-yellow tg-mono text-[10px] uppercase tracking-wider px-2 py-1 text-tango-white"
                        >
                          <option value="item_by_item">ITEM A ITEM</option>
                          <option value="force_all_to">FORÇA TUDO</option>
                          <option value="allowed_split">SPLIT</option>
                        </select>
                      ) : (
                        <ModeChip mode={r.classification_mode} />
                      )}
                    </Td>
                    <Td>
                      {isEditing ? (
                        draft.classification_mode === "force_all_to" ? (
                          <select
                            value={draft.force_product_type ?? ""}
                            onChange={(e) =>
                              setDraft({ ...draft, force_product_type: e.target.value })
                            }
                            className="bg-tango-charcoal border border-tango-yellow tg-mono text-[10px] uppercase tracking-wider px-2 py-1 text-tango-white"
                          >
                            {PRODUCT_TYPES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        ) : draft.classification_mode === "allowed_split" ? (
                          <Input
                            value={(draft.allowed_product_types ?? []).join(",")}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                allowed_product_types: e.target.value
                                  .split(",")
                                  .map((s) => s.trim().toUpperCase())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="FOOD,SALMON"
                            className="text-xs"
                          />
                        ) : (
                          <span className="tg-mono text-[11px] text-tango-muted">—</span>
                        )
                      ) : r.classification_mode === "force_all_to" ? (
                        <span className="tg-mono text-[11px] text-tango-yellow uppercase tracking-wider">
                          → {r.force_product_type}
                        </span>
                      ) : r.classification_mode === "allowed_split" ? (
                        <span className="tg-mono text-[11px] text-tango-white uppercase tracking-wider">
                          {(r.allowed_product_types ?? []).join(" + ")}
                        </span>
                      ) : (
                        <span className="tg-mono text-[11px] text-tango-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      {isEditing ? (
                        <Input
                          value={draft.default_payment_method ?? ""}
                          onChange={(e) =>
                            setDraft({ ...draft, default_payment_method: e.target.value })
                          }
                          className="text-xs"
                        />
                      ) : (
                        <PaymentChip pm={r.default_payment_method} />
                      )}
                    </Td>
                    <Td className="text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={draft.supplies_count_as_cmv ?? false}
                          onChange={(e) =>
                            setDraft({ ...draft, supplies_count_as_cmv: e.target.checked })
                          }
                          className="w-4 h-4 accent-tango-yellow"
                        />
                      ) : r.supplies_count_as_cmv ? (
                        <span className="tg-mono text-tango-yellow">✓</span>
                      ) : (
                        <span className="text-tango-muted">—</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={save}
                            disabled={saving}
                            className="text-tango-yellow hover:text-tango-yellow-hi p-1"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-tango-muted hover:text-tango-white p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(r)}
                            className="text-tango-muted hover:text-tango-yellow transition-colors p-1"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove(r.id)}
                            className="text-tango-muted hover:text-tango-red transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CMV Rules — read only */}
      <section className="bg-tango-charcoal border border-tango-border">
        <div className="px-6 py-5 border-b border-tango-border">
          <h2 className="tg-display uppercase tracking-wider text-sm mb-1">
            REGRAS DE CMV — POR CATEGORIA
          </h2>
          <p className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
            QUAL CATEGORIA DE ITEM CONTA COMO CMV · GERENCIADO PELA TABELA org_cmv_rules
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tango-border">
                <Th>CATEGORIA</Th>
                <Th>SUBCATEGORIA</Th>
                <Th className="text-center">CMV?</Th>
                <Th>LABEL</Th>
              </tr>
            </thead>
            <tbody>
              {cmvRules.map((r) => (
                <tr key={r.id} className="border-b border-tango-border/40">
                  <Td className="tg-display uppercase tracking-wider text-sm">{r.category}</Td>
                  <Td className="tg-mono text-[11px] text-tango-muted uppercase tracking-wider">
                    {r.subcategory ?? "(todas)"}
                  </Td>
                  <Td className="text-center">
                    {r.is_cmv ? (
                      <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-yellow border border-tango-yellow px-2 py-0.5">
                        SIM
                      </span>
                    ) : (
                      <span className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted border border-tango-border px-2 py-0.5">
                        NÃO
                      </span>
                    )}
                  </Td>
                  <Td className="tg-mono text-[11px] text-tango-muted">{r.label}</Td>
                </tr>
              ))}
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

function ModeChip({ mode }: { mode: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    item_by_item: { label: "ITEM A ITEM", cls: "text-tango-muted border-tango-border" },
    force_all_to: { label: "FORÇA TUDO", cls: "text-tango-yellow border-tango-yellow" },
    allowed_split: { label: "SPLIT", cls: "text-tango-white border-tango-white" },
  };
  const c = map[mode] ?? map.item_by_item;
  return (
    <span
      className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function PaymentChip({ pm }: { pm: string | null }) {
  if (!pm) return <span className="tg-mono text-[11px] text-tango-muted">—</span>;
  let cls = "text-tango-muted border-tango-border";
  if (pm.toUpperCase().includes("CHECK")) cls = "text-tango-yellow border-tango-yellow";
  else if (pm.toUpperCase().includes("ACH")) cls = "text-tango-white border-tango-white";
  else if (pm.toUpperCase().includes("MASTER") || pm.toUpperCase().includes("VISA"))
    cls = "text-tango-red border-tango-red";
  return (
    <span className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${cls}`}>
      {pm}
    </span>
  );
}

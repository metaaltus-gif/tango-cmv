"use client";

import { useState } from "react";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierItemsModal } from "@/components/supplier-items-modal";
import type { SupplierRule, CmvRule, ClassificationMode } from "@/lib/types";

const ORG_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "1");
const PRODUCT_TYPES = ["FOOD", "SALMON", "DRINK", "OTHER", "SUPPLIES", "EQUIPMENT", "FURNITURE"];
const CATEGORIES = ["Food", "Drink", "Cleaning", "Supplies", "Equipment", "Furniture", "Other"];

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
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [openItemsModal, setOpenItemsModal] = useState<{ id: number; name: string } | null>(null);

  // Flash de sucesso/erro pra QUALQUER save. "ok" some rápido, "err" fica.
  const flash = (type: "ok" | "err", msg: string) => {
    setSaveStatus({ type, msg });
    if (type === "ok") setTimeout(() => setSaveStatus(null), 2000);
  };

  // Auto-save centralizado: garante que se count=0 OU erro, aparece banner.
  const runSave = async <T,>(
    label: string,
    op: () => Promise<{ data: T | null; error: any; count?: number | null }>,
    onOk?: (data: T) => void
  ): Promise<boolean> => {
    setSaveStatus({ type: "ok", msg: `Salvando ${label}…` });
    const { data, error, count } = await op();
    if (error) {
      flash("err", `NÃO SALVOU ${label}: ${error.message}`);
      return false;
    }
    if (count === 0) {
      flash("err", `NÃO SALVOU ${label}: RLS bloqueou (0 rows).`);
      return false;
    }
    if (data && onOk) onOk(data);
    flash("ok", `${label} SALVO ✓`);
    return true;
  };

  // ---- SUPPLIER RULES ----
  const [editingSup, setEditingSup] = useState<number | null>(null);
  const [draftSup, setDraftSup] = useState<Partial<SupplierRule>>({});
  const [addingSup, setAddingSup] = useState(false);
  const [newSup, setNewSup] = useState<Partial<SupplierRule>>({
    supplier_name: "",
    classification_mode: "item_by_item",
    default_payment_method: "Net 30",
    supplies_count_as_cmv: false,
  });

  // ---- CMV RULES ----
  const [editingCmv, setEditingCmv] = useState<number | null>(null);
  const [draftCmv, setDraftCmv] = useState<Partial<CmvRule>>({});
  const [addingCmv, setAddingCmv] = useState(false);
  const [newCmv, setNewCmv] = useState<Partial<CmvRule>>({
    category: "Food",
    subcategory: null,
    is_cmv: true,
    label: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  // ============= SUPPLIER RULES CRUD =============
  const startEditSup = (rule: SupplierRule) => {
    setEditingSup(rule.id);
    setDraftSup({ ...rule });
    setError(null);
  };
  const cancelEditSup = () => {
    setEditingSup(null);
    setDraftSup({});
  };
  const saveSup = async () => {
    if (!editingSup) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("org_supplier_rules")
      .update({
        classification_mode: draftSup.classification_mode,
        force_product_type: draftSup.force_product_type || null,
        allowed_product_types: draftSup.allowed_product_types || null,
        default_payment_method: draftSup.default_payment_method,
        supplies_count_as_cmv: draftSup.supplies_count_as_cmv,
        notes: draftSup.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingSup)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSupplierRules((rs) => rs.map((r) => (r.id === editingSup ? (data as SupplierRule) : r)));
    cancelEditSup();
  };
  const addSup = async () => {
    if (!newSup.supplier_name) {
      setError("Nome do fornecedor é obrigatório");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: any = {
      organization_id: ORG_ID,
      supplier_name: newSup.supplier_name?.toUpperCase().replace(/ /g, "_"),
      classification_mode: newSup.classification_mode ?? "item_by_item",
      force_product_type: newSup.force_product_type || null,
      allowed_product_types: newSup.allowed_product_types || null,
      default_payment_method: newSup.default_payment_method ?? "Net 30",
      supplies_count_as_cmv: newSup.supplies_count_as_cmv ?? false,
      notes: newSup.notes ?? null,
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
    setAddingSup(false);
    setNewSup({
      supplier_name: "",
      classification_mode: "item_by_item",
      default_payment_method: "Net 30",
      supplies_count_as_cmv: false,
    });
  };
  const removeSup = async (id: number) => {
    if (!confirm("Remover esta regra?")) return;
    const { error } = await supabase.from("org_supplier_rules").delete().eq("id", id);
    if (error) return setError(error.message);
    setSupplierRules((rs) => rs.filter((r) => r.id !== id));
  };

  // ============= CMV RULES CRUD =============
  const startEditCmv = (rule: CmvRule) => {
    setEditingCmv(rule.id);
    setDraftCmv({ ...rule });
    setError(null);
  };
  const cancelEditCmv = () => {
    setEditingCmv(null);
    setDraftCmv({});
  };
  const saveCmv = async () => {
    if (!editingCmv) return;
    setSaving(true);
    const ok = await runSave<CmvRule>(
      "regra CMV",
      () =>
        supabase
          .from("org_cmv_rules")
          .update({
            category: draftCmv.category,
            subcategory: draftCmv.subcategory || null,
            is_cmv: draftCmv.is_cmv,
            label: draftCmv.label,
            notes: draftCmv.notes,
          })
          .eq("id", editingCmv)
          .select()
          .single() as any,
      (data) => setCmvRules((rs) => rs.map((r) => (r.id === editingCmv ? (data as CmvRule) : r)))
    );
    setSaving(false);
    if (ok) cancelEditCmv();
  };
  const addCmv = async () => {
    if (!newCmv.category) {
      flash("err", "Categoria é obrigatória");
      return;
    }
    setSaving(true);
    const payload: any = {
      organization_id: ORG_ID,
      category: newCmv.category,
      subcategory: newCmv.subcategory || null,
      is_cmv: newCmv.is_cmv ?? true,
      label: newCmv.label ?? "",
      notes: newCmv.notes ?? null,
    };
    const ok = await runSave<CmvRule>(
      "nova regra CMV",
      () =>
        supabase
          .from("org_cmv_rules")
          .insert(payload)
          .select()
          .single() as any,
      (data) => {
        setCmvRules((rs) =>
          [...rs, data as CmvRule].sort((a, b) => {
            const c = a.category.localeCompare(b.category);
            if (c !== 0) return c;
            return (a.subcategory ?? "").localeCompare(b.subcategory ?? "");
          })
        );
      }
    );
    setSaving(false);
    if (ok) {
      setAddingCmv(false);
      setNewCmv({ category: "Food", subcategory: null, is_cmv: true, label: "", notes: "" });
    }
  };
  const removeCmv = async (id: number) => {
    if (!confirm("Remover esta regra?")) return;
    const { error } = await supabase.from("org_cmv_rules").delete().eq("id", id);
    if (error) return setError(error.message);
    setCmvRules((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="tg-mono text-[11px] uppercase tracking-wider border border-tango-red text-tango-red px-4 py-3">
          {error}
        </div>
      )}
      {saveStatus && (
        <div
          className={
            "sticky top-0 z-30 tg-mono text-[11px] uppercase tracking-wider border px-4 py-3 flex items-center justify-between " +
            (saveStatus.type === "ok"
              ? "border-tango-yellow text-tango-yellow bg-tango-yellow/10"
              : "border-tango-red text-tango-red bg-tango-red/10")
          }
        >
          <span>{saveStatus.msg}</span>
          <button
            onClick={() => setSaveStatus(null)}
            className="hover:text-tango-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {openItemsModal && (
        <SupplierItemsModal
          supplierId={openItemsModal.id}
          supplierName={openItemsModal.name}
          organizationId={ORG_ID}
          onClose={() => setOpenItemsModal(null)}
        />
      )}

      {/* ============ SUPPLIER RULES ============ */}
      <section className="bg-tango-charcoal border border-tango-border">
        <div className="flex items-center justify-between px-6 py-5 border-b border-tango-border">
          <div>
            <h2 className="tg-display uppercase tracking-wider text-sm mb-1">REGRAS POR FORNECEDOR</h2>
            <p className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
              {supplierRules.length} fornecedores configurados
            </p>
          </div>
          <Button onClick={() => setAddingSup(!addingSup)} variant={addingSup ? "secondary" : "primary"} size="sm">
            {addingSup ? "CANCELAR" : "+ ADICIONAR"}
          </Button>
        </div>

        {addingSup && (
          <div className="bg-tango-black border-b border-tango-border px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">NOME · EX: WALMART</label>
                <Input
                  value={newSup.supplier_name ?? ""}
                  onChange={(e) => setNewSup({ ...newSup, supplier_name: e.target.value })}
                  placeholder="WALMART"
                />
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">MODO</label>
                <select
                  value={newSup.classification_mode}
                  onChange={(e) => setNewSup({ ...newSup, classification_mode: e.target.value as ClassificationMode })}
                  className="w-full bg-tango-charcoal border border-tango-border px-3 py-2.5 text-sm text-tango-white focus:outline-none focus:border-tango-yellow"
                >
                  <option value="item_by_item">ITEM POR ITEM</option>
                  <option value="force_all_to">TUDO VAI PRA UM TIPO</option>
                  <option value="allowed_split">SÓ PERMITE ALGUNS</option>
                </select>
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">PAGAMENTO</label>
                <Input
                  value={newSup.default_payment_method ?? ""}
                  onChange={(e) => setNewSup({ ...newSup, default_payment_method: e.target.value })}
                  placeholder="CHECK, ACH, etc"
                />
              </div>
              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="new_scc"
                  checked={newSup.supplies_count_as_cmv ?? false}
                  onChange={(e) => setNewSup({ ...newSup, supplies_count_as_cmv: e.target.checked })}
                  className="w-4 h-4 accent-tango-yellow"
                />
                <label htmlFor="new_scc" className="ml-3 tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
                  SUPPLIES CONTAM COMO CMV
                </label>
              </div>
            </div>
            <Button onClick={addSup} disabled={saving} variant="primary" size="md">
              {saving ? "..." : "SALVAR REGRA"}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tango-border">
                <Th>FORNECEDOR</Th>
                <Th>CMV</Th>
                <Th>MODO</Th>
                <Th>RESTRIÇÃO</Th>
                <Th>PAGAMENTO</Th>
                <Th className="text-center">SUPP=CMV</Th>
                <Th className="text-right">AÇÕES</Th>
              </tr>
            </thead>
            <tbody>
              {supplierRules.map((r, idx) => {
                const isEditing = editingSup === r.id;
                return (
                  <tr key={r.id} className="border-b border-tango-border/40 hover:bg-tango-panel">
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
                      <CmvModeCell
                        rule={r as any}
                        onChange={async (mode) => {
                          const ok = await runSave<SupplierRule>(
                            `CMV mode do ${r.supplier_name}`,
                            () =>
                              supabase
                                .from("org_supplier_rules")
                                .update({ cmv_mode: mode, updated_at: new Date().toISOString() })
                                .eq("id", r.id)
                                .select()
                                .single() as any,
                            (data) => {
                              setSupplierRules((rs) =>
                                rs.map((x) => (x.id === r.id ? (data as SupplierRule) : x))
                              );
                            }
                          );
                          // Se marcou EDITAR e salvou ok, abre modal item-a-item
                          if (ok && mode === "edit") {
                            const sup = await supabase
                              .from("suppliers")
                              .select("id")
                              .eq("name", r.supplier_name)
                              .maybeSingle();
                            if (sup.data?.id) {
                              setOpenItemsModal({ id: sup.data.id, name: r.supplier_name });
                            } else {
                              flash("err", `Fornecedor ${r.supplier_name} não achado em suppliers.`);
                            }
                          }
                        }}
                      />
                    </Td>
                    <Td>
                      {isEditing ? (
                        <select
                          value={draftSup.classification_mode}
                          onChange={(e) => setDraftSup({ ...draftSup, classification_mode: e.target.value as ClassificationMode })}
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
                        draftSup.classification_mode === "force_all_to" ? (
                          <select
                            value={draftSup.force_product_type ?? ""}
                            onChange={(e) => setDraftSup({ ...draftSup, force_product_type: e.target.value })}
                            className="bg-tango-charcoal border border-tango-yellow tg-mono text-[10px] uppercase tracking-wider px-2 py-1 text-tango-white"
                          >
                            {PRODUCT_TYPES.map((p) => (<option key={p} value={p}>{p}</option>))}
                          </select>
                        ) : draftSup.classification_mode === "allowed_split" ? (
                          <Input
                            value={(draftSup.allowed_product_types ?? []).join(",")}
                            onChange={(e) => setDraftSup({ ...draftSup, allowed_product_types: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) })}
                            placeholder="FOOD,SALMON"
                            className="text-xs"
                          />
                        ) : (<span className="tg-mono text-[11px] text-tango-muted">—</span>)
                      ) : r.classification_mode === "force_all_to" ? (
                        <span className="tg-mono text-[11px] text-tango-yellow uppercase tracking-wider">→ {r.force_product_type}</span>
                      ) : r.classification_mode === "allowed_split" ? (
                        <span className="tg-mono text-[11px] text-tango-white uppercase tracking-wider">
                          {(r.allowed_product_types ?? []).join(" + ")}
                        </span>
                      ) : (<span className="tg-mono text-[11px] text-tango-muted">—</span>)}
                    </Td>
                    <Td>
                      {isEditing ? (
                        <Input value={draftSup.default_payment_method ?? ""} onChange={(e) => setDraftSup({ ...draftSup, default_payment_method: e.target.value })} className="text-xs" />
                      ) : (
                        <PaymentChip pm={r.default_payment_method} />
                      )}
                    </Td>
                    <Td className="text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={draftSup.supplies_count_as_cmv ?? false} onChange={(e) => setDraftSup({ ...draftSup, supplies_count_as_cmv: e.target.checked })} className="w-4 h-4 accent-tango-yellow" />
                      ) : r.supplies_count_as_cmv ? (<span className="tg-mono text-tango-yellow">✓</span>) : (<span className="text-tango-muted">—</span>)}
                    </Td>
                    <Td className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={saveSup} disabled={saving} className="text-tango-yellow hover:text-tango-yellow-hi p-1"><Save size={14} /></button>
                          <button onClick={cancelEditSup} className="text-tango-muted hover:text-tango-white p-1"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => startEditSup(r)} className="text-tango-muted hover:text-tango-yellow p-1"><Pencil size={14} /></button>
                          <button onClick={() => removeSup(r.id)} className="text-tango-muted hover:text-tango-red p-1"><Trash2 size={14} /></button>
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

      {/* ============ CMV RULES (agora editáveis) ============ */}
      <section className="bg-tango-charcoal border border-tango-border">
        <div className="flex items-center justify-between px-6 py-5 border-b border-tango-border">
          <div>
            <h2 className="tg-display uppercase tracking-wider text-sm mb-1">REGRAS DE CMV — POR CATEGORIA</h2>
            <p className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
              QUAL CATEGORIA DE ITEM CONTA COMO CMV
            </p>
          </div>
          <Button onClick={() => setAddingCmv(!addingCmv)} variant={addingCmv ? "secondary" : "primary"} size="sm">
            {addingCmv ? "CANCELAR" : "+ ADICIONAR"}
          </Button>
        </div>

        {addingCmv && (
          <div className="bg-tango-black border-b border-tango-border px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">CATEGORIA</label>
                <select
                  value={newCmv.category}
                  onChange={(e) => setNewCmv({ ...newCmv, category: e.target.value })}
                  className="w-full bg-tango-charcoal border border-tango-border px-3 py-2.5 text-sm text-tango-white focus:outline-none focus:border-tango-yellow"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">SUBCATEGORIA · OPCIONAL</label>
                <Input value={newCmv.subcategory ?? ""} onChange={(e) => setNewCmv({ ...newCmv, subcategory: e.target.value || null })} placeholder="ex: Salmon" />
              </div>
              <div>
                <label className="block tg-mono text-[9px] uppercase tracking-widest text-tango-muted mb-2">LABEL · EXIBIÇÃO</label>
                <Input value={newCmv.label ?? ""} onChange={(e) => setNewCmv({ ...newCmv, label: e.target.value })} placeholder="Nome amigável" />
              </div>
              <div className="flex items-center pt-7">
                <input type="checkbox" id="new_cmv" checked={newCmv.is_cmv ?? true} onChange={(e) => setNewCmv({ ...newCmv, is_cmv: e.target.checked })} className="w-4 h-4 accent-tango-yellow" />
                <label htmlFor="new_cmv" className="ml-3 tg-mono text-[10px] uppercase tracking-widest text-tango-muted">CONTA COMO CMV</label>
              </div>
            </div>
            <Button onClick={addCmv} disabled={saving} variant="primary" size="md">
              {saving ? "..." : "SALVAR REGRA"}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tango-border">
                <Th>CATEGORIA</Th>
                <Th>SUBCATEGORIA</Th>
                <Th className="text-center">CMV?</Th>
                <Th>LABEL</Th>
                <Th className="text-right">AÇÕES</Th>
              </tr>
            </thead>
            <tbody>
              {cmvRules.map((r) => {
                const isEditing = editingCmv === r.id;
                return (
                  <tr key={r.id} className="border-b border-tango-border/40 hover:bg-tango-panel">
                    <Td>
                      {isEditing ? (
                        <select
                          value={draftCmv.category}
                          onChange={(e) => setDraftCmv({ ...draftCmv, category: e.target.value })}
                          className="bg-tango-charcoal border border-tango-yellow tg-mono text-[10px] uppercase tracking-wider px-2 py-1 text-tango-white"
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className="tg-display uppercase tracking-wider text-sm">{r.category}</span>
                      )}
                    </Td>
                    <Td>
                      {isEditing ? (
                        <Input value={draftCmv.subcategory ?? ""} onChange={(e) => setDraftCmv({ ...draftCmv, subcategory: e.target.value || null })} placeholder="(todas)" className="text-xs" />
                      ) : (
                        <span className="tg-mono text-[11px] text-tango-muted uppercase tracking-wider">{r.subcategory ?? "(todas)"}</span>
                      )}
                    </Td>
                    <Td className="text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={draftCmv.is_cmv ?? false} onChange={(e) => setDraftCmv({ ...draftCmv, is_cmv: e.target.checked })} className="w-4 h-4 accent-tango-yellow" />
                      ) : (
                        <button
                          onClick={async () => {
                            const next = !r.is_cmv;
                            await runSave<CmvRule>(
                              `regra ${r.category}${r.subcategory ? "/" + r.subcategory : ""}`,
                              () =>
                                supabase
                                  .from("org_cmv_rules")
                                  .update({ is_cmv: next })
                                  .eq("id", r.id)
                                  .select()
                                  .single() as any,
                              (data) => setCmvRules((rs) => rs.map((x) => (x.id === r.id ? (data as CmvRule) : x)))
                            );
                          }}
                          title="Clique pra alternar CMV / NÃO CMV"
                          className={
                            "tg-mono text-[10px] uppercase tracking-widest border px-2 py-0.5 transition-colors " +
                            (r.is_cmv
                              ? "text-tango-yellow border-tango-yellow hover:bg-tango-yellow/10"
                              : "text-tango-muted border-tango-border hover:text-tango-white hover:border-tango-white")
                          }
                        >
                          {r.is_cmv ? "SIM" : "NÃO"}
                        </button>
                      )}
                    </Td>
                    <Td>
                      {isEditing ? (
                        <Input value={draftCmv.label ?? ""} onChange={(e) => setDraftCmv({ ...draftCmv, label: e.target.value })} className="text-xs" />
                      ) : (
                        <span className="tg-mono text-[11px] text-tango-muted">{r.label}</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={saveCmv} disabled={saving} className="text-tango-yellow hover:text-tango-yellow-hi p-1"><Save size={14} /></button>
                          <button onClick={cancelEditCmv} className="text-tango-muted hover:text-tango-white p-1"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => startEditCmv(r)} className="text-tango-muted hover:text-tango-yellow p-1"><Pencil size={14} /></button>
                          <button onClick={() => removeCmv(r.id)} className="text-tango-muted hover:text-tango-red p-1"><Trash2 size={14} /></button>
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
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (<th className={`tg-mono text-[9px] uppercase tracking-widest3 text-tango-muted font-bold text-left px-6 py-3 ${className}`}>{children}</th>);
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
  return (<span className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${c.cls}`}>{c.label}</span>);
}
function PaymentChip({ pm }: { pm: string | null }) {
  if (!pm) return <span className="tg-mono text-[11px] text-tango-muted">—</span>;
  let cls = "text-tango-muted border-tango-border";
  if (pm.toUpperCase().includes("CHECK")) cls = "text-tango-yellow border-tango-yellow";
  else if (pm.toUpperCase().includes("ACH")) cls = "text-tango-white border-tango-white";
  else if (pm.toUpperCase().includes("MASTER") || pm.toUpperCase().includes("VISA")) cls = "text-tango-red border-tango-red";
  return (<span className={`tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${cls}`}>{pm}</span>);
}

function CmvModeCell({
  rule,
  onChange,
}: {
  rule: SupplierRule & { cmv_mode?: string };
  onChange: (mode: string) => void;
}) {
  const current = (rule as any).cmv_mode || "edit";
  const modes: { key: string; label: string; activeCls: string }[] = [
    { key: "always", label: "SEMPRE", activeCls: "text-tango-yellow border-tango-yellow bg-tango-yellow/10" },
    { key: "edit",   label: "EDITAR", activeCls: "text-tango-white border-tango-white bg-tango-white/10" },
    { key: "never",  label: "NUNCA",  activeCls: "text-tango-red border-tango-red bg-tango-red/10" },
  ];
  return (
    <div className="flex gap-1">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={
            "tg-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 transition-colors " +
            (current === m.key
              ? m.activeCls
              : "text-tango-muted border-tango-border hover:border-tango-white hover:text-tango-white")
          }
          title={`Mudar para ${m.label}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

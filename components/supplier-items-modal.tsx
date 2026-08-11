"use client";

import { useEffect, useState } from "react";
import { X, Search, Check } from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://cmv-control-api.onrender.com";

interface Item {
  key: string;
  display: string;
  descriptions: string[];
  count: number;
  total_spent: number;
  sample_item_id: string;
  current_is_cmv: boolean | null;
  product_type: string | null;
  memorized: boolean;
  memorized_is_cmv: boolean | null;
}

export function SupplierItemsModal({
  supplierId,
  supplierName,
  organizationId,
  onClose,
}: {
  supplierId: number;
  supplierName: string;
  organizationId: number;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [statusMsg, setStatusMsg] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${BACKEND_URL}/suppliers/${supplierId}/items-summary?organization_id=${organizationId}`
        );
        if (!r.ok) throw new Error(`backend ${r.status}: ${await r.text()}`);
        const data = await r.json();
        setItems(data.items || []);
      } catch (e: any) {
        setError(e.message || "Erro ao carregar itens");
      } finally {
        setLoading(false);
      }
    })();
  }, [supplierId, organizationId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const flash = (type: "ok" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), type === "ok" ? 1500 : 6000);
  };

  const toggle = async (it: Item, newValue: boolean) => {
    setSavingKeys((s) => new Set([...s, it.key]));
    try {
      const r = await fetch(`${BACKEND_URL}/items/bulk-classify`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          supplier_id: supplierId,
          organization_id: organizationId,
          description_normalized: it.key,
          is_cmv: newValue,
        }),
      });
      if (!r.ok) throw new Error(`backend ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const data = await r.json();
      // atualiza item na lista
      setItems((all) =>
        all.map((x) =>
          x.key === it.key
            ? {
                ...x,
                current_is_cmv: newValue,
                memorized: true,
                memorized_is_cmv: newValue,
              }
            : x
        )
      );
      flash("ok", `Atualizados ${data.items_updated} item(s) · memorizado ✓`);
    } catch (e: any) {
      flash("error", `NÃO SALVOU: ${e.message}`);
    } finally {
      setSavingKeys((s) => {
        const n = new Set(s);
        n.delete(it.key);
        return n;
      });
    }
  };

  const filtered = items.filter((it) =>
    it.display.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-tango-charcoal border border-tango-border w-full max-w-3xl h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tango-border">
          <div>
            <div className="tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
              EDITAR CLASSIFICAÇÃO · ITEM POR ITEM
            </div>
            <h2 className="tg-display text-xl uppercase tracking-wider mt-1">
              {supplierName.replace(/_/g, " ")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-tango-muted hover:text-tango-white p-2"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status flash */}
        {statusMsg && (
          <div
            className={
              "tg-mono text-[11px] uppercase tracking-wider px-6 py-2 border-b " +
              (statusMsg.type === "ok"
                ? "border-tango-yellow text-tango-yellow bg-tango-yellow/10"
                : "border-tango-red text-tango-red bg-tango-red/10")
            }
          >
            {statusMsg.text}
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-3 border-b border-tango-border/60">
          <div className="flex items-center gap-3 bg-tango-black border border-tango-border px-3 py-2">
            <Search size={14} className="text-tango-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="buscar item…"
              className="flex-1 bg-transparent outline-none text-sm text-tango-white placeholder:text-tango-muted"
            />
            <span className="tg-mono text-[10px] text-tango-muted">
              {filtered.length} / {items.length}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 text-tango-muted text-sm">Carregando…</div>
          )}
          {error && (
            <div className="p-6 text-tango-red text-sm">Erro: {error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-6 text-tango-muted text-sm">
              Nenhum item comprado desse fornecedor ainda.
            </div>
          )}
          {!loading &&
            filtered.map((it) => {
              const isSaving = savingKeys.has(it.key);
              const isCmv = it.current_is_cmv === true;
              return (
                <div
                  key={it.key}
                  className="flex items-center gap-4 px-6 py-3 border-b border-tango-border/40 hover:bg-tango-panel/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-tango-white truncate">
                      {it.display}
                    </div>
                    <div className="tg-mono text-[10px] text-tango-muted mt-0.5 flex gap-3">
                      <span>{it.count}x comprado</span>
                      <span>·</span>
                      <span>${it.total_spent.toFixed(2)}</span>
                      {it.memorized && (
                        <>
                          <span>·</span>
                          <span className="text-tango-yellow">
                            <Check size={10} className="inline" /> memorizado
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => !isSaving && toggle(it, true)}
                      disabled={isSaving}
                      className={
                        "tg-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 transition-colors " +
                        (isCmv
                          ? "text-tango-yellow border-tango-yellow bg-tango-yellow/10"
                          : "text-tango-muted border-tango-border hover:border-tango-white hover:text-tango-white") +
                        (isSaving ? " opacity-50 cursor-wait" : "")
                      }
                    >
                      CMV
                    </button>
                    <button
                      onClick={() => !isSaving && toggle(it, false)}
                      disabled={isSaving}
                      className={
                        "tg-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 transition-colors " +
                        (!isCmv
                          ? "text-tango-red border-tango-red bg-tango-red/10"
                          : "text-tango-muted border-tango-border hover:border-tango-white hover:text-tango-white") +
                        (isSaving ? " opacity-50 cursor-wait" : "")
                      }
                    >
                      NÃO CMV
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-tango-border tg-mono text-[10px] uppercase tracking-widest text-tango-muted">
          Cada clique já salva no banco + na memória. Próximas notas desse
          fornecedor aplicam automaticamente.
        </div>
      </div>
    </div>
  );
}

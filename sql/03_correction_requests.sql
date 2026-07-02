-- ============================================================
-- Tango CMV — Sistema de solicitação de correções
-- Cria tabela onde usuários podem reportar dados errados
-- (data, fornecedor, valor, classificação) via app OU Telegram
-- Cola no Supabase SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,

  reported_by UUID NOT NULL,        -- auth.users.id
  reported_via TEXT NOT NULL DEFAULT 'dashboard'
    CHECK (reported_via IN ('dashboard', 'telegram')),

  report_type TEXT NOT NULL
    CHECK (report_type IN ('date', 'supplier', 'amount', 'classification', 'missing', 'other')),

  current_value TEXT,
  suggested_value TEXT,
  notes TEXT,

  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_review', 'applied', 'rejected')),

  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correction_org_status
  ON correction_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_correction_invoice
  ON correction_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_correction_reported_by
  ON correction_requests(reported_by);

-- RLS
ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;

-- Todos da org podem ver as correções
DROP POLICY IF EXISTS "corrections_read_org" ON correction_requests;
CREATE POLICY "corrections_read_org"
  ON correction_requests FOR SELECT TO authenticated
  USING (organization_id = user_org_id());

-- Usuário pode CRIAR correção pra própria org
DROP POLICY IF EXISTS "corrections_insert_own" ON correction_requests;
CREATE POLICY "corrections_insert_own"
  ON correction_requests FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = user_org_id()
    AND reported_by = auth.uid()
  );

-- Owner pode UPDATE (aprovar/rejeitar/aplicar)
DROP POLICY IF EXISTS "corrections_owner_update" ON correction_requests;
CREATE POLICY "corrections_owner_update"
  ON correction_requests FOR UPDATE TO authenticated
  USING (
    organization_id = user_org_id()
    AND user_role() = 'owner'
  );

-- Autor pode DELETAR próprias correções "open"
DROP POLICY IF EXISTS "corrections_author_delete" ON correction_requests;
CREATE POLICY "corrections_author_delete"
  ON correction_requests FOR DELETE TO authenticated
  USING (
    reported_by = auth.uid()
    AND status = 'open'
  );

-- Trigger pra atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_correction_touch ON correction_requests;
CREATE TRIGGER trg_correction_touch
  BEFORE UPDATE ON correction_requests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMENT ON TABLE correction_requests IS
  'Solicitações de correção reportadas via dashboard ou Telegram.
   Owner revisa e aplica/rejeita. Fica log completo pra auditoria.';

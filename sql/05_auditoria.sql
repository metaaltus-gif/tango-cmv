-- ============================================================
-- Tango CMV — Tabela de Auditoria (audit_log)
-- Registra TODAS as ações importantes no sistema:
--  · Aprovações/rejeições de correção
--  · Edições de regras (supplier + cmv)
--  · Alterações em app_users (roles, telegram)
--  · Login/logout (via trigger no auth.users futuramente)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,

  actor_id UUID,                    -- auth.users.id de quem fez
  actor_name TEXT,                  -- snapshot do full_name (pra sobreviver a delete)
  actor_role TEXT,                  -- snapshot do role no momento

  action TEXT NOT NULL,             -- 'create', 'update', 'delete', 'apply', 'reject', 'login', etc
  entity_type TEXT NOT NULL,        -- 'correction_request', 'supplier_rule', 'cmv_rule', 'invoice', 'app_user'
  entity_id TEXT,                   -- id do registro afetado

  old_value JSONB,                  -- estado antes (se update/delete)
  new_value JSONB,                  -- estado depois (se create/update)

  via TEXT DEFAULT 'app',           -- 'app', 'telegram', 'bot', 'system'
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Todos da org podem LER o histórico (transparência)
DROP POLICY IF EXISTS "audit_read_org" ON audit_log;
CREATE POLICY "audit_read_org"
  ON audit_log FOR SELECT TO authenticated
  USING (organization_id = user_org_id());

-- Só o sistema (SECURITY DEFINER functions) escreve
DROP POLICY IF EXISTS "audit_no_direct_write" ON audit_log;
CREATE POLICY "audit_no_direct_write"
  ON audit_log FOR ALL TO authenticated
  USING (false);

-- Ninguém deleta auditoria via UI (só admin do banco)
-- (implícito pela policy acima)

-- ============================================================
-- Trigger genérico pra logar mudanças em correction_requests
-- ============================================================
CREATE OR REPLACE FUNCTION audit_correction_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_role TEXT;
  v_action TEXT;
BEGIN
  -- Ignora se o próprio audit_log tá inserindo (evita loop)
  IF TG_TABLE_NAME = 'audit_log' THEN RETURN NEW; END IF;

  SELECT full_name, role INTO v_actor_name, v_actor_role
    FROM app_users WHERE id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      v_action := NEW.status;   -- 'applied', 'rejected', 'in_review'
    ELSE
      v_action := 'update';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
  END IF;

  INSERT INTO audit_log(
    organization_id, actor_id, actor_name, actor_role,
    action, entity_type, entity_id,
    old_value, new_value
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    v_actor_name,
    v_actor_role,
    v_action,
    'correction_request',
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_correction ON correction_requests;
CREATE TRIGGER trg_audit_correction
  AFTER INSERT OR UPDATE OR DELETE ON correction_requests
  FOR EACH ROW EXECUTE FUNCTION audit_correction_change();

-- ============================================================
-- Trigger genérico pra logar mudanças em org_supplier_rules
-- ============================================================
CREATE OR REPLACE FUNCTION audit_supplier_rule_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_actor_name TEXT; v_actor_role TEXT; v_action TEXT;
BEGIN
  SELECT full_name, role INTO v_actor_name, v_actor_role
    FROM app_users WHERE id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  INSERT INTO audit_log(
    organization_id, actor_id, actor_name, actor_role,
    action, entity_type, entity_id, old_value, new_value
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(), v_actor_name, v_actor_role,
    v_action, 'supplier_rule', COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_supplier_rule ON org_supplier_rules;
CREATE TRIGGER trg_audit_supplier_rule
  AFTER INSERT OR UPDATE OR DELETE ON org_supplier_rules
  FOR EACH ROW EXECUTE FUNCTION audit_supplier_rule_change();

-- ============================================================
-- Trigger genérico pra logar mudanças em org_cmv_rules
-- ============================================================
CREATE OR REPLACE FUNCTION audit_cmv_rule_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_actor_name TEXT; v_actor_role TEXT; v_action TEXT;
BEGIN
  SELECT full_name, role INTO v_actor_name, v_actor_role
    FROM app_users WHERE id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  INSERT INTO audit_log(
    organization_id, actor_id, actor_name, actor_role,
    action, entity_type, entity_id, old_value, new_value
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(), v_actor_name, v_actor_role,
    v_action, 'cmv_rule', COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_cmv_rule ON org_cmv_rules;
CREATE TRIGGER trg_audit_cmv_rule
  AFTER INSERT OR UPDATE OR DELETE ON org_cmv_rules
  FOR EACH ROW EXECUTE FUNCTION audit_cmv_rule_change();

-- ============================================================
-- Trigger em app_users (mudanças de role, telegram, etc)
-- ============================================================
CREATE OR REPLACE FUNCTION audit_app_user_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_actor_name TEXT; v_actor_role TEXT; v_action TEXT;
BEGIN
  SELECT full_name, role INTO v_actor_name, v_actor_role
    FROM app_users WHERE id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  INSERT INTO audit_log(
    organization_id, actor_id, actor_name, actor_role,
    action, entity_type, entity_id, old_value, new_value
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(), v_actor_name, v_actor_role,
    v_action, 'app_user', COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_app_user ON app_users;
CREATE TRIGGER trg_audit_app_user
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW EXECUTE FUNCTION audit_app_user_change();

COMMENT ON TABLE audit_log IS
  'Log completo de alterações no Tango. Escrita bloqueada via RLS,
   população automática por triggers com SECURITY DEFINER. Todos da org podem ler.';

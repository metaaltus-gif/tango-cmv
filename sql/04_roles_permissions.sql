-- ============================================================
-- Tango CMV — Perfis + Permissões
-- 4 perfis:
--   dev     = Leticia (desenvolvedora, pode tudo)
--   owner   = decide, mas não edita dados operacionais
--   manager = opera, aprova correções, edita regras
--   viewer  = só consulta + exporta
-- ============================================================

-- 1. Aceita 'viewer' e 'dev' como role válido
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'app_users'::regclass
    AND conname LIKE '%role%check%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE app_users DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('dev', 'owner', 'manager', 'viewer'));

-- 2. Função helper — é dev ou manager?
CREATE OR REPLACE FUNCTION user_is_manager_or_dev()
RETURNS BOOLEAN
SECURITY DEFINER
STABLE
LANGUAGE SQL AS $$
  SELECT role IN ('dev', 'manager')
  FROM app_users
  WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION user_is_manager_or_dev() TO authenticated, anon;

-- 3. RLS das REGRAS — manager ou dev editam (era só owner)
DROP POLICY IF EXISTS "supplier_rules_owner_modify" ON org_supplier_rules;
DROP POLICY IF EXISTS "supplier_rules_manager_modify" ON org_supplier_rules;
CREATE POLICY "supplier_rules_manager_modify"
    ON org_supplier_rules FOR ALL TO authenticated
    USING (
        organization_id = user_org_id()
        AND user_is_manager_or_dev()
    )
    WITH CHECK (organization_id = user_org_id());

DROP POLICY IF EXISTS "cmv_rules_owner_modify" ON org_cmv_rules;
DROP POLICY IF EXISTS "cmv_rules_manager_modify" ON org_cmv_rules;
CREATE POLICY "cmv_rules_manager_modify"
    ON org_cmv_rules FOR ALL TO authenticated
    USING (
        organization_id = user_org_id()
        AND user_is_manager_or_dev()
    )
    WITH CHECK (organization_id = user_org_id());

-- 4. Correções: manager ou dev aplica
DROP POLICY IF EXISTS "corrections_owner_update" ON correction_requests;
DROP POLICY IF EXISTS "corrections_manager_update" ON correction_requests;
CREATE POLICY "corrections_manager_update"
  ON correction_requests FOR UPDATE TO authenticated
  USING (
    organization_id = user_org_id()
    AND user_is_manager_or_dev()
  );

-- 5. app_users — manager/dev gerencia
DROP POLICY IF EXISTS "app_users_owner_manager_modify" ON app_users;
DROP POLICY IF EXISTS "app_users_manager_modify" ON app_users;
CREATE POLICY "app_users_manager_modify"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    organization_id = user_org_id()
    AND user_is_manager_or_dev()
  )
  WITH CHECK (organization_id = user_org_id());

-- 6. Promove Leticia a 'dev' (que era owner)
UPDATE app_users
SET role = 'dev'
WHERE id = 'f1477d50-525d-4ae0-81bf-289d3bd49996';  -- meta.altus@gmail.com

-- Se ainda tiver a dedenv row, promove ela pra manager (caso Andre)
UPDATE app_users
SET role = 'manager'
WHERE id = '0a1b3fea-a175-4b1d-bb57-aed907c5d672'
  AND role != 'dev';

-- Confirma perfis
SELECT id, full_name, role, telegram_user_id FROM app_users;

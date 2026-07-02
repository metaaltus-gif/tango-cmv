/**
 * Central de permissões por perfil.
 * Sync com as RLS policies do Supabase.
 */

export type UserRole = "dev" | "owner" | "manager" | "viewer" | null;

export function canEditRules(role: UserRole): boolean {
  return role === "dev" || role === "manager";
}

export function canApplyCorrections(role: UserRole): boolean {
  return role === "dev" || role === "manager";
}

export function canReportIssue(role: UserRole): boolean {
  // Todos os perfis autenticados podem reportar (inclusive viewer)
  return role !== null;
}

export function canExportReports(role: UserRole): boolean {
  return role !== null;
}

export function canManageUsers(role: UserRole): boolean {
  return role === "dev" || role === "manager";
}

export function canViewAudit(role: UserRole): boolean {
  return role !== null;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "dev": return "DEV";
    case "owner": return "OWNER";
    case "manager": return "MANAGER";
    case "viewer": return "VIEWER";
    default: return "?";
  }
}

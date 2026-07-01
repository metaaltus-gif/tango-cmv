import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav, StatusBar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Pega dados do app_users pra mostrar nome + role
  const { data: profile } = await supabase
    .from("app_users")
    .select("full_name, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col bg-tango-black">
      <Nav
        userEmail={user.email}
        userName={profile?.full_name ?? null}
        userRole={profile?.role ?? null}
      />
      <main className="flex-1 px-6 lg:px-8 py-8">{children}</main>
      <StatusBar userName={profile?.full_name ?? null} />
    </div>
  );
}

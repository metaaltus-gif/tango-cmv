import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav, StatusBar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-tango-black">
      <Nav userEmail={user.email} />
      <main className="flex-1 px-6 lg:px-8 py-8">{children}</main>
      <StatusBar />
    </div>
  );
}

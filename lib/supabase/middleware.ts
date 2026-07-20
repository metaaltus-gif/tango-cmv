import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas publicas — nao precisa estar autenticado pra acessar
const PUBLIC_ROUTES = ["/login", "/reset-password", "/auth"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Faltando NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou _ANON_KEY) no .env.local"
    );
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        supabaseResponse = NextResponse.next({ request });
        supabaseResponse.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        supabaseResponse = NextResponse.next({ request });
        supabaseResponse.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );

  if (!user && !isPublicRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

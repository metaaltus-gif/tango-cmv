"use client";

import { createBrowserClient } from "@supabase/ssr";

// Aceita tanto o novo formato (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
// quanto o legacy (NEXT_PUBLIC_SUPABASE_ANON_KEY). Pegue o que estiver definido.
export function createClient() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Faltando NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou _ANON_KEY) no .env.local"
    );
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Cliente Supabase para uso em Server Components / Server Actions / Route Handlers.
// Usa a chave anónima + a sessão do cookie do utilizador — respeita RLS.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Pode falhar em Server Components puros — o middleware já trata do refresh.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );
}

// Cliente com a service role key — só pode ser usado em código de servidor
// (API routes / server actions) e nunca deve ser importado em ficheiros "use client".
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

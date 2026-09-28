import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mantém a sessão Supabase Auth atualizada em cada pedido.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options) {
          response.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  const rotaPublica = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/casos");

  if (!data.user && !rotaPublica) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

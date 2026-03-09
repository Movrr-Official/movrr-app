import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { APP_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/signin", origin));
  }

  const response = NextResponse.redirect(new URL(next, APP_URL));
  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);

  if (next === "/auth/reset-password") {
    response.cookies.set({
      name: "movrr-password-recovery",
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      secure: APP_URL.startsWith("https://"),
      path: "/auth/reset-password",
      maxAge: 60 * 15,
    });
  }

  return response;
}

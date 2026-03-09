import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } from "@/lib/env";

const protectedPrefixes = ["/dashboard", "/rider", "/advertiser"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/auth/:path*", "/dashboard/:path*", "/rider/:path*", "/advertiser/:path*"],
};

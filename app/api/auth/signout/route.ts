import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/env";
import { isTrustedSameOriginRequest } from "@/lib/requestProtection";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth/signin", APP_URL), {
    headers: { "cache-control": "no-store" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "POST, OPTIONS" },
  });
}

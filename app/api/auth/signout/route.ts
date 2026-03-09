import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth/signin", APP_URL));
}

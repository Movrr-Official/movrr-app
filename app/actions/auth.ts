"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_URL } from "@/lib/env";

export async function signInWithPassword(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, error: "" };
}

export async function sendPasswordReset(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: "" };
}

export async function updatePassword(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const cookieStore = await cookies();
  const recoveryAllowed = cookieStore.get("movrr-password-recovery")?.value === "1";
  if (!recoveryAllowed) {
    throw new Error("Password reset session is not valid.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }

  cookieStore.set({
    name: "movrr-password-recovery",
    value: "0",
    path: "/auth/reset-password",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
}

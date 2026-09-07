"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { APP_URL } from "@/lib/env";
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
} from "@/lib/email/send-auth-email";

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
  const redirectTo = `${APP_URL}/auth/callback?next=/auth/reset-password`;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (!error && data.properties?.hashed_token) {
    const resetUrl = new URL("/auth/confirm", APP_URL);
    resetUrl.searchParams.set("token_hash", data.properties.hashed_token);
    const delivery = await sendPasswordResetEmail(
      email,
      resetUrl.toString(),
    );
    if (delivery.sent) return { success: true, error: "" };
    // An ambiguous provider failure may already have accepted the message.
    // A later request reuses the same provider idempotency window safely.
    if (delivery.reason === "failed") return { success: true, error: "" };
  }

  // Preserve the existing Supabase SMTP path during staged rollout or provider
  // disruption. The public response remains generic to prevent account discovery.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.warn("Password recovery link could not be generated", {
      status: error.status,
    });
  }

  return { success: true, error: "" };
}

export async function confirmPasswordRecovery(
  tokenHash: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  if (!/^[A-Za-z0-9_-]{20,512}$/.test(tokenHash)) {
    redirect("/auth/signin?error=invalid_recovery_link");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (error) {
    redirect("/auth/signin?error=expired_recovery_link");
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "movrr-password-recovery",
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: APP_URL.startsWith("https://"),
    path: "/auth/reset-password",
    maxAge: 60 * 15,
  });
  redirect("/auth/reset-password");
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

  if (user.email) {
    // A delivery failure must never roll back a successful password change.
    await sendPasswordChangedEmail(user.id, user.email);
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

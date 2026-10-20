"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAccountDeletionReceipt } from "@/lib/accountDeletionContract";
export async function requestAccountDeletion(form: FormData) {
  const session = await requireProductSession(["rider"]);
  const client = await createSupabaseServerClient();
  let error: string | undefined;
  try {
    if(form.get("accountId") !== session.appUser.id) throw new Error("Account changed. Reload before requesting deletion.");
    if (form.get("acknowledgeDisclosure") !== "on")
      throw new Error("Read and acknowledge the account deletion disclosure.");
    const password = String(form.get("password") ?? "");
    if (password) {
      const proof = await client.auth.signInWithPassword({
        email: session.authUser.email!,
        password,
      });
      if (proof.error || proof.data.user?.id !== session.authUser.id)
        throw new Error("Reauthentication failed. Retry from your own account.");
    }
    const identity = await client.auth.getUser();
    if (identity.error || identity.data.user?.id !== session.authUser.id)
      throw new Error("Account changed. Sign in again.");
    const result = await client.functions.invoke("delete-account", {
      body: { policyVersion: 1, acknowledgeDisclosure: true },
    });
    if (result.error) {
      const body = await (result.error.context as Response | undefined)
        ?.json()
        .catch(() => null);
      throw new Error(
        body?.error === "reauthentication_required"
          ? "Sign in again before requesting deletion. Provider reauthorization is available in MOVRR Mobile."
          : "Deletion request requires review or is unavailable. Your request has not been confirmed.",
      );
    }
    if (!isAccountDeletionReceipt(result.data))
      throw new Error("Deletion request was not confirmed.");
    const receiptAccess = z
      .object({
        credential: z.string().regex(/^[0-9a-f]{64}$/),
        expiresAt: z.string().datetime({ offset: true }),
      })
      .optional()
      .parse((result.data as { receiptAccess?: unknown }).receiptAccess);
    const expires = receiptAccess
      ? new Date(receiptAccess.expiresAt)
      : new Date(Date.now() + 60 * 60 * 1000);
    await (
      await cookies()
    ).set(
      "movrr-deletion-receipt",
      JSON.stringify({ requestId: result.data.requestId, ...receiptAccess }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires,
      },
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Deletion request unavailable";
  }
  if (error) redirect(`/dashboard/privacy?${new URLSearchParams({ error })}`);
  redirect("/account/deletion-receipt");
}

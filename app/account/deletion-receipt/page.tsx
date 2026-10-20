import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAccountDeletionReceipt } from "@/lib/accountDeletionContract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export const dynamic = "force-dynamic";
export default async function DeletionReceiptPage() {
  let status: string | undefined,
    requestId: string | undefined,
    message = "No saved deletion receipt is available.";
  try {
    const raw = (await cookies()).get("movrr-deletion-receipt")?.value;
    const access = z
      .object({
        requestId: z.string().uuid(),
        credential: z
          .string()
          .regex(/^[0-9a-f]{64}$/)
          .optional(),
        expiresAt: z.string().datetime({ offset: true }).optional(),
      })
      .parse(raw ? JSON.parse(raw) : null);
    requestId = access.requestId;
    if (access.expiresAt && Date.parse(access.expiresAt) <= Date.now())
      throw new Error(
        "Receipt access expired. Contact support with your request reference.",
      );
    const db = access.credential
      ? createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : await createSupabaseServerClient();
    const result = await db.functions.invoke("delete-account", {
      ...(access.credential
        ? { headers: { Authorization: `Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}` } }
        : {}),
      body: access.credential
        ? { operation: "receipt", requestId, credential: access.credential }
        : { operation: "status", requestId },
    });
    if (result.error || !isAccountDeletionReceipt(result.data))
      throw new Error(
        "Receipt status unavailable. Retry later or contact support with your request reference.",
      );
    status = result.data.status;
  } catch (e) {
    message = e instanceof Error ? e.message : "Receipt unavailable";
  }
  return (
    <main className="page-canvas max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Account deletion receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requestId && <p>Request reference: {requestId}</p>}
          {status ? (
            <p role="status">Status: {status.replaceAll("_", " ")}</p>
          ) : (
            <p role="alert">{message}</p>
          )}
          <p>This receipt provides deletion status only.</p>
          <a className="text-primary" href="/account/deletion-receipt">
            Refresh status
          </a>
        </CardContent>
      </Card>
    </main>
  );
}

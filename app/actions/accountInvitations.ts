"use server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function acceptAccountInvitation(token: string) {
  z.string().regex(/^[a-f0-9]{64}$/).parse(token);
  const session = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) throw new Error("Sign in with the verified invited email before accepting this invitation");
  const { error } = await createSupabaseAdminClient().rpc("accept_organisation_invitation", {
    p_user: user.id, p_token_hash: createHash("sha256").update(token).digest("hex"),
  });
  if (error) throw new Error(error.message);
}

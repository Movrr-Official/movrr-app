"use server";
import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "@/lib/platform/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function riderSelfServiceAction(form: FormData) {
  const session = await requireProductSession(["rider"]);
  let error: string | undefined;
  try {
    if(form.get("accountId") !== session.appUser.id) throw new Error("Account changed");
    const feature = z
      .enum(["accessories", "brands", "achievements"])
      .parse(form.get("feature"));
    const body =
      feature === "brands"
        ? {
            brandId: z.string().uuid().parse(form.get("id")),
            preference: z
              .enum(["preferred", "neutral", "avoided"])
              .parse(form.get("preference")),
          }
        : feature === "accessories"
          ? {
              assignmentId: z.string().uuid().parse(form.get("id")),
              action: z
                .enum(["installed", "issue_reported", "damaged", "missing", "lost"])
                .parse(form.get("action")),
              note: String(form.get("note") ?? ""),
            }
          : {};
    await platformFetch(`/riders/me/${feature}`, { method: "POST", body });
  } catch {
    error = "Update unavailable. Refresh your account and retry.";
  }
  const destination = form.get("feature") === "achievements" ? "/dashboard/rewards" : "/dashboard/settings/self-service";
  revalidatePath(destination);
  redirect(
    `${destination}?${new URLSearchParams(error ? { error } : { success: "Account updated." })}`,
  );
}

"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import { PlatformApiError } from "@/lib/platform/types";
import {
  confirmCampaignParticipation,
  optInToCampaign,
  withdrawCampaignSignup,
} from "@/lib/platform/campaignPlatform";
import { communityInstant } from "@/lib/communitySchedule";
import {
  joinCommunityRide,
  createCommunityRide,
  leaveCommunityRide,
  editCommunityRide,
  cancelCommunityRide,
} from "@/lib/platform/communityPlatform";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  markSingleNotificationRead,
  markUserNotificationsRead,
  persistNotificationsPreference,
  revalidateRoleNotificationPaths,
} from "@/lib/notifications";

function redirectWithStatus(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
}

function mapPlatformError(error: unknown): string {
  if (error instanceof PlatformApiError) return error.message;
  return error instanceof Error ? error.message : "Platform request failed";
}

export async function updateRiderProfileAction(formData: FormData) {
  const session = await requireProductSession(["rider"]);
  if (formData.get("accountId") !== session.appUser.id) redirectWithStatus("/dashboard/settings", {error:"Account changed. Reload before editing your profile."});
  const profile = z
    .object({
      phone: z.string().max(100),
      city: z.string().max(200),
      country: z.string().max(100),
      emergency_contact: z.string().max(200),
      emergency_phone: z.string().max(100),
      vehicle_type: z.string().max(100),
      language: z.enum(["en-US", "nl-NL"]),
    })
    .safeParse({
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      country: String(formData.get("country") ?? ""),
      emergency_contact: String(formData.get("emergencyContact") ?? ""),
      emergency_phone: String(formData.get("emergencyPhone") ?? ""),
      vehicle_type: String(formData.get("vehicleType") ?? ""),
      language: formData.get("languagePreference"),
    });
  if (!profile.success)
    redirectWithStatus("/dashboard/settings", {
      error: "Check your profile fields and supported language.",
    });
  const { error } = await (
    await createSupabaseServerClient()
  ).rpc("update_my_rider_profile", { p_profile: profile.data });
  if (error)
    redirectWithStatus("/dashboard/settings", {
      error: "Profile update unavailable. No changes were saved.",
    });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirectWithStatus("/dashboard/settings", { success: "Rider profile updated." });
}

export async function updateRiderNotificationPreferencesAction(formData: FormData) {
  const session = await requireProductSession(["rider"]);
  const notifications =
    String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("rider");
  redirectWithStatus("/dashboard/notifications", {
    success: "Notification preference saved.",
  });
}

export async function markRiderNotificationsReadAction() {
  const session = await requireProductSession(["rider"]);
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", {
    success: "Notifications marked as read.",
  });
}

export async function markRiderNotificationReadAction(formData: FormData) {
  const session = await requireProductSession(["rider"]);
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

export async function optInCampaignAction(formData: FormData) {
  await requireProductSession(["rider"]);
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  if (!campaignId) {
    redirectWithStatus("/dashboard/campaigns", { error: "Missing campaign id." });
  }
  try {
    await optInToCampaign(campaignId);
  } catch (error) {
    redirectWithStatus("/dashboard/campaigns", { error: mapPlatformError(error) });
  }
  revalidatePath("/dashboard/campaigns");
  redirectWithStatus("/dashboard/campaigns", { success: "Joined campaign." });
}

export async function withdrawCampaignAction(formData: FormData) {
  await requireProductSession(["rider"]);
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  if (!campaignId) {
    redirectWithStatus("/dashboard/campaigns", { error: "Missing campaign id." });
  }
  try {
    await withdrawCampaignSignup(campaignId);
  } catch (error) {
    redirectWithStatus("/dashboard/campaigns", { error: mapPlatformError(error) });
  }
  revalidatePath("/dashboard/campaigns");
  redirectWithStatus("/dashboard/campaigns", { success: "Withdrew from campaign." });
}

export async function confirmCampaignAction(formData: FormData) {
  await requireProductSession(["rider"]);
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  if (!campaignId) {
    redirectWithStatus("/dashboard/campaigns", { error: "Missing campaign id." });
  }
  try {
    await confirmCampaignParticipation(campaignId);
  } catch (error) {
    redirectWithStatus("/dashboard/campaigns", { error: mapPlatformError(error) });
  }
  revalidatePath("/dashboard/campaigns");
  redirectWithStatus("/dashboard/campaigns", { success: "Participation confirmed." });
}

export async function communityRideAction(
  _previous: { success: boolean; error?: string; message?: string } | null,
  formData: FormData,
) {
  const session = await requireProductSession(["rider"]);
  let success = "Community ride updated.";
  try {
    if (formData.get("accountId") !== session.appUser.id) throw new Error("Account changed. Reload before updating community rides.");
    const action = String(formData.get("action") ?? "");
    const id = String(formData.get("id") ?? "");
    const expected = String(formData.get("expectedUpdatedAt") ?? "");
    if (action === "join") await joinCommunityRide(id);
    else if (action === "leave") await leaveCommunityRide(id);
    else if (action === "cancel") await cancelCommunityRide(id, expected);
    else if (action === "create" || action === "edit") {
      const local = String(formData.get("scheduledAt") ?? "");
      const original = String(formData.get("originalScheduledAt") ?? "");
      const scheduledAt =
        action === "edit" && local === String(formData.get("originalLocalTime") ?? "")
          ? original
          : communityInstant(
              local,
              String(formData.get("timezone") ?? "Europe/Amsterdam"),
              String(formData.get("occurrence") ?? ""),
            );
      const input = {
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        scheduledAt,
        meetingPoint: String(formData.get("meetingPoint") ?? "").trim(),
        category: String(formData.get("category") ?? "social"),
        maxParticipants: Number(formData.get("maxParticipants")),
      };
      if (action === "create") {
        await createCommunityRide({
          ...input,
          operationId: String(formData.get("operationId") ?? ""),
        });
        success = "Community ride created.";
      } else await editCommunityRide(id, { ...input, expectedUpdatedAt: expected });
    } else throw new Error("Unknown community action");
  } catch (error) {
    return { success: false, error: mapPlatformError(error) };
  }
  revalidatePath("/dashboard/community");
  return { success: true, message: success };
}

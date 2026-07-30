import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import { PlatformApiError } from "@/lib/platform/types";
import {
  confirmCampaignParticipation,
  optInToCampaign,
  withdrawCampaignSignup,
} from "@/lib/platform/campaignPlatform";
import { joinCommunityRide, createCommunityRide } from "@/lib/platform/communityPlatform";
import { redeemReward } from "@/lib/platform/riderPlatform";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { markSingleNotificationRead, markUserNotificationsRead, persistNotificationsPreference, revalidateRoleNotificationPaths } from "@/lib/notifications";

function redirectWithStatus(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
}

function mapPlatformError(error: unknown): string {
  if (error instanceof PlatformApiError) return error.message;
  return error instanceof Error ? error.message : "Platform request failed";
}

export async function updateRiderProfileAction(formData: FormData) {
  "use server";

  const session = await requireProductSession(["rider"]);
  const admin = createSupabaseAdminClient();

  const payload = {
    phone: String(formData.get("phone") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    country: String(formData.get("country") ?? "").trim() || null,
    emergency_contact: String(formData.get("emergencyContact") ?? "").trim() || null,
    emergency_phone: String(formData.get("emergencyPhone") ?? "").trim() || null,
    vehicle_type: String(formData.get("vehicleType") ?? "").trim() || null,
    language_preference: String(formData.get("languagePreference") ?? "").trim() || "en",
  };

  const [userResult, riderResult] = await Promise.all([
    admin.from("user").update({ phone: payload.phone, language_preference: payload.language_preference }).eq("id", session.appUser.id),
    admin.from("rider").update({ city: payload.city, country: payload.country, emergency_contact: payload.emergency_contact, emergency_phone: payload.emergency_phone, vehicle_type: payload.vehicle_type }).eq("user_id", session.appUser.id),
  ]);

  if (userResult.error || riderResult.error) {
    redirectWithStatus("/dashboard/settings", { error: userResult.error?.message || riderResult.error?.message || "Failed to update rider profile" });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirectWithStatus("/dashboard/settings", { success: "Rider profile updated." });
}

export async function updateRiderNotificationPreferencesAction(formData: FormData) {
  "use server";

  const session = await requireProductSession(["rider"]);
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("rider");
  redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markRiderNotificationsReadAction() {
  "use server";

  const session = await requireProductSession(["rider"]);
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markRiderNotificationReadAction(formData: FormData) {
  "use server";

  const session = await requireProductSession(["rider"]);
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

export async function optInCampaignAction(formData: FormData) {
  "use server";
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
  "use server";
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
  "use server";
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

export async function redeemRewardAction(formData: FormData) {
  "use server";
  await requireProductSession(["rider"]);
  const catalogItemId = String(formData.get("catalogItemId") ?? "").trim();
  if (!catalogItemId) {
    redirectWithStatus("/dashboard/rewards/shop", { error: "Missing catalog item." });
  }
  try {
    const result = await redeemReward(catalogItemId);
    const id =
      result && typeof result === "object" && "id" in result
        ? String((result as { id: string }).id)
        : null;
    revalidatePath("/dashboard/rewards");
    revalidatePath("/dashboard/rewards/shop");
    if (id) {
      redirectWithStatus(`/dashboard/rewards/orders/${id}`, {
        success: "Reward redeemed.",
      });
    }
    redirectWithStatus("/dashboard/rewards/shop", { success: "Reward redeemed." });
  } catch (error) {
    redirectWithStatus("/dashboard/rewards/shop", { error: mapPlatformError(error) });
  }
}

export async function createCommunityRideAction(formData: FormData) {
  "use server";
  await requireProductSession(["rider"]);
  const title = String(formData.get("title") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  if (!title || !scheduledAt) {
    redirectWithStatus("/dashboard/community", {
      error: "Title and scheduled time are required.",
    });
  }
  try {
    await createCommunityRide({
      title,
      scheduledAt,
      description: String(formData.get("description") ?? "").trim() || undefined,
      meetingPoint: String(formData.get("meetingPoint") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      maxParticipants: Number(formData.get("maxParticipants") ?? 20) || 20,
    });
  } catch (error) {
    redirectWithStatus("/dashboard/community", { error: mapPlatformError(error) });
  }
  revalidatePath("/dashboard/community");
  redirectWithStatus("/dashboard/community", { success: "Community ride created." });
}

export async function joinCommunityRideAction(formData: FormData) {
  "use server";
  await requireProductSession(["rider"]);
  const communityRideId = String(formData.get("communityRideId") ?? "").trim();
  if (!communityRideId) {
    redirectWithStatus("/dashboard/community", { error: "Missing ride id." });
  }
  try {
    await joinCommunityRide(communityRideId);
  } catch (error) {
    redirectWithStatus("/dashboard/community", { error: mapPlatformError(error) });
  }
  revalidatePath("/dashboard/community");
  redirectWithStatus("/dashboard/community", { success: "Joined community ride." });
}

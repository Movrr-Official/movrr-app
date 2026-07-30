"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import {
  createAdvertiserCampaign,
  updateAdvertiserCampaign,
  updateAdvertiserCampaignStatus,
} from "@/lib/platform/advertiserCampaignPlatform";
import type { CampaignLifecycleStatus } from "@/lib/platform/capabilityRegistry.types";
import { PlatformApiError } from "@/lib/platform/types";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
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

export async function updateAdvertiserSettingsAction(formData: FormData) {
  const session = await requireProductSession(["advertiser"]);
  const admin = createSupabaseAdminClient();

  const payload = {
    name: String(formData.get("contactName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    company_name: String(formData.get("companyName") ?? "").trim(),
    company_email: String(formData.get("companyEmail") ?? "").trim().toLowerCase(),
    website: String(formData.get("website") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    language: String(formData.get("language") ?? "").trim() || "en",
    timezone: String(formData.get("timezone") ?? "").trim() || "UTC",
    email_notifications: String(formData.get("emailNotifications") ?? "false") === "true",
    campaign_updates: String(formData.get("campaignUpdates") ?? "false") === "true",
  };
  const productNotifications = String(formData.get("productNotifications") ?? "false") === "true";

  const [userResult, advertiserResult, preferencesResult] = await Promise.all([
    admin.from("user").update({ name: payload.name, phone: payload.phone, organization: payload.company_name, language_preference: payload.language }).eq("id", session.appUser.id),
    admin.from("advertiser").update(payload).eq("user_id", session.appUser.id),
    admin.from("user_preferences").upsert({ user_id: session.appUser.id, notifications: productNotifications }, { onConflict: "user_id" }),
  ]);

  if (userResult.error || advertiserResult.error || preferencesResult.error) {
    redirectWithStatus("/dashboard/settings", { error: userResult.error?.message || advertiserResult.error?.message || preferencesResult.error?.message || "Failed to update advertiser settings" });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirectWithStatus("/dashboard/settings", { success: "Advertiser settings updated." });
}

export async function updateAdvertiserNotificationPreferencesAction(formData: FormData) {
  const session = await requireProductSession(["advertiser"]);
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("advertiser");
  redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markAdvertiserNotificationsReadAction() {
  const session = await requireProductSession(["advertiser"]);
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markAdvertiserNotificationReadAction(formData: FormData) {
  const session = await requireProductSession(["advertiser"]);
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

export async function createCampaignAction(formData: FormData) {
  await requireProductSession(["advertiser"]);

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const budget = Number(formData.get("budget") ?? 0);

  if (!name || !startDate || !endDate) {
    redirectWithStatus("/dashboard/campaigns/create", {
      error: "Name, start date, and end date are required.",
    });
  }

  const campaignTypeRaw = String(formData.get("campaignType") ?? "");
  const campaignType =
    campaignTypeRaw === "swarm" || campaignTypeRaw === "destination_ride"
      ? campaignTypeRaw
      : undefined;

  try {
    const result = await createAdvertiserCampaign({
      name,
      description: String(formData.get("description") ?? "").trim() || undefined,
      budget,
      startDate,
      endDate,
      campaignType,
      targetZones: String(formData.get("targetZones") ?? "")
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean),
    });
    const id =
      result && typeof result === "object" && "id" in result
        ? String((result as { id: string }).id)
        : null;
    revalidatePath("/dashboard/campaigns");
    revalidatePath("/dashboard");
    if (id) {
      redirectWithStatus(`/dashboard/campaigns/${id}/edit`, {
        success: "Campaign draft created.",
      });
    }
    redirectWithStatus("/dashboard/campaigns", { success: "Campaign created." });
  } catch (error) {
    redirectWithStatus("/dashboard/campaigns/create", {
      error: mapPlatformError(error),
    });
  }
}

export async function updateCampaignAction(formData: FormData) {
  await requireProductSession(["advertiser"]);
  const id = String(formData.get("campaignId") ?? "").trim();
  if (!id) {
    redirectWithStatus("/dashboard/campaigns", { error: "Missing campaign id." });
  }

  try {
    await updateAdvertiserCampaign(id, {
      name: String(formData.get("name") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      budget: formData.get("budget") ? Number(formData.get("budget")) : undefined,
      startDate: String(formData.get("startDate") ?? "").trim() || undefined,
      endDate: String(formData.get("endDate") ?? "").trim() || undefined,
      targetZones: String(formData.get("targetZones") ?? "")
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean),
    });
  } catch (error) {
    redirectWithStatus(`/dashboard/campaigns/${id}/edit`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${id}`);
  redirectWithStatus(`/dashboard/campaigns/${id}/edit`, {
    success: "Campaign updated.",
  });
}

export async function updateCampaignStatusAction(formData: FormData) {
  await requireProductSession(["advertiser"]);
  const id = String(formData.get("campaignId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as CampaignLifecycleStatus;
  if (!id || !status) {
    redirectWithStatus("/dashboard/campaigns", { error: "Missing campaign or status." });
  }

  try {
    await updateAdvertiserCampaignStatus(id, status);
  } catch (error) {
    redirectWithStatus(`/dashboard/campaigns/${id}/edit`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${id}`);
  redirectWithStatus(`/dashboard/campaigns/${id}/edit`, {
    success: `Campaign status updated to ${status.replace(/_/g, " ")}.`,
  });
}

export async function redirectAdvertiserCampaignCreate() {
  redirect("/dashboard/campaigns/create");
}

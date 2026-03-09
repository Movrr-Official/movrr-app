import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { markSingleNotificationRead, markUserNotificationsRead, persistNotificationsPreference, revalidateRoleNotificationPaths } from "@/lib/notifications";

function redirectWithStatus(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
}

export async function updateAdvertiserSettingsAction(formData: FormData) {
  "use server";

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
  "use server";

  const session = await requireProductSession(["advertiser"]);
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("advertiser");
  redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markAdvertiserNotificationsReadAction() {
  "use server";

  const session = await requireProductSession(["advertiser"]);
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markAdvertiserNotificationReadAction(formData: FormData) {
  "use server";

  const session = await requireProductSession(["advertiser"]);
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

export async function redirectAdvertiserCampaignCreate() {
  redirect("/dashboard/campaigns");
}

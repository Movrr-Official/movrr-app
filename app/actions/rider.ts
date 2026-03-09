import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { markSingleNotificationRead, markUserNotificationsRead, persistNotificationsPreference, revalidateRoleNotificationPaths } from "@/lib/notifications";

function redirectWithStatus(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
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
  const notifications = String(formData.get("productNotifications") ?? "") === "on";

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

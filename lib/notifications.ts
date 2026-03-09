import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function persistNotificationsPreference(userId: string, notifications: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("user_preferences").upsert({ user_id: userId, notifications }, { onConflict: "user_id" });
  if (error) throw new Error(error.message || "Failed to update notification preferences");
}

export async function markUserNotificationsRead(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw new Error(error.message || "Failed to mark notifications as read");
}

export async function markSingleNotificationRead(userId: string, notificationId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("id", notificationId);
  if (error) throw new Error(error.message || "Failed to mark notification as read");
}

export function revalidateRoleNotificationPaths(_role: "rider" | "advertiser") {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

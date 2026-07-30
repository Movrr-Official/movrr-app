import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type ProductNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  isRead: boolean;
  createdAt: string;
};

export function mapProductNotificationCategory(
  type?: string | null,
  role?: "advertiser" | "rider" | "partner" | "government",
) {
  if (!type) return "general";
  if (type.includes("campaign")) return "campaign";
  if (type.includes("billing")) return "billing";
  if (type.includes("fulfilment") || type.includes("collection")) return "fulfilment";
  if (type.includes("programme") || type.includes("program")) return "programme";
  if (type.includes("compliance")) return "compliance";
  if (type.includes("route")) return "route";
  if (type.includes("reward")) return "reward";
  if (role === "partner" && type.includes("partner")) return "account";
  if (role === "government" && type.includes("government")) return "account";
  return "account";
}

export async function listUserNotifications(
  userId: string,
  role?: "advertiser" | "rider" | "partner" | "government",
  limit = 25,
): Promise<ProductNotification[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("id, title, message, type, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || "Failed to load notifications");

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    category: mapProductNotificationCategory(row.type, role),
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  }));
}

export async function getUserNotificationPreferences(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("user_preferences")
    .select("notifications")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.notifications ?? true;
}

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

export function revalidateRoleNotificationPaths(
  _role: "rider" | "advertiser" | "partner" | "government",
) {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

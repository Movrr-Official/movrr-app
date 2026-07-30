"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductSession } from "@/lib/appUser";
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

export async function updateGovernmentNotificationPreferencesAction(formData: FormData) {
  const session = await requireProductSession(["government"]);
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("government");
  redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markGovernmentNotificationsReadAction() {
  const session = await requireProductSession(["government"]);
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markGovernmentNotificationReadAction(formData: FormData) {
  const session = await requireProductSession(["government"]);
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

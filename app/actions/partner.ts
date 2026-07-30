"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { PlatformApiError } from "@/lib/platform/types";
import {
  markSingleNotificationRead,
  markUserNotificationsRead,
  persistNotificationsPreference,
  revalidateRoleNotificationPaths,
} from "@/lib/notifications";
import {
  confirmPartnerCollection,
  importPartnerResourceCodes,
  invitePartnerStaff,
  patchPartnerSettings,
  updatePartnerStaffRole,
  validatePartnerToken,
} from "@/services/partner";

function redirectWithStatus(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
}

function mapPlatformError(error: unknown): string {
  if (error instanceof PlatformApiError) {
    if (
      error.kind === "AlreadyConfirmed" ||
      error.message.toLowerCase().includes("already")
    ) {
      return "This collection was already confirmed.";
    }
    if (
      error.kind === "ConcurrencyConflict" ||
      error.status === 409 ||
      error.message.toLowerCase().includes("version")
    ) {
      return "This fulfilment changed concurrently. Refresh and try again.";
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Platform request failed";
}

export async function confirmCollectionAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(
      session.partnerContext!.capabilities,
      "fulfilment.confirm",
    )
  ) {
    redirectWithStatus("/dashboard/collections", {
      error: "Your role cannot confirm collections.",
    });
  }

  const fulfilmentId = String(formData.get("fulfilmentId") ?? "").trim();
  if (!fulfilmentId) {
    redirectWithStatus("/dashboard/collections", {
      error: "Missing fulfilment id.",
    });
  }

  try {
    await confirmPartnerCollection(fulfilmentId);
  } catch (error) {
    redirectWithStatus(`/dashboard/collections/${fulfilmentId}`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${fulfilmentId}`);
  revalidatePath("/dashboard");
  redirectWithStatus(`/dashboard/collections/${fulfilmentId}`, {
    success: "Collection confirmed.",
  });
}

export async function validateTokenAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(
      session.partnerContext!.capabilities,
      "fulfilment.validate",
    )
  ) {
    redirectWithStatus("/dashboard/validate", {
      error: "Your role cannot validate tokens.",
    });
  }

  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirectWithStatus("/dashboard/validate", {
      error: "Enter a validation code.",
    });
  }

  try {
    await validatePartnerToken(token);
  } catch (error) {
    redirectWithStatus("/dashboard/validate", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/collections");
  revalidatePath("/dashboard/validate");
  redirectWithStatus("/dashboard/validate", {
    success: "Token validated by Platform API.",
  });
}

export async function importResourceCodesAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(
      session.partnerContext!.capabilities,
      "resources.manage",
    )
  ) {
    redirectWithStatus("/dashboard/resources", {
      error: "Your role cannot manage resources.",
    });
  }

  const resourceId = String(formData.get("resourceId") ?? "").trim();
  const codesRaw = String(formData.get("codes") ?? "");
  const codes = codesRaw
    .split(/[\n,]+/)
    .map((code) => code.trim())
    .filter(Boolean);

  if (!resourceId || codes.length === 0) {
    redirectWithStatus("/dashboard/resources", {
      error: "Resource id and at least one code are required.",
    });
  }

  try {
    const result = await importPartnerResourceCodes({ resourceId, codes });
    revalidatePath("/dashboard/resources");
    redirectWithStatus("/dashboard/resources", {
      success: `Imported ${result.imported} code(s).`,
    });
  } catch (error) {
    redirectWithStatus("/dashboard/resources", {
      error: mapPlatformError(error),
    });
  }
}

export async function inviteStaffAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "staff.manage")
  ) {
    redirectWithStatus("/dashboard/staff", {
      error: "Your role cannot manage staff.",
    });
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId || !role) {
    redirectWithStatus("/dashboard/staff", {
      error: "User id and role are required.",
    });
  }

  try {
    await invitePartnerStaff({ userId, role });
  } catch (error) {
    redirectWithStatus("/dashboard/staff", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/staff");
  redirectWithStatus("/dashboard/staff", {
    success: "Staff member invited.",
  });
}

export async function updateStaffRoleAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "staff.manage")
  ) {
    redirectWithStatus("/dashboard/staff", {
      error: "Your role cannot manage staff.",
    });
  }

  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!membershipId || !role) {
    redirectWithStatus("/dashboard/staff", {
      error: "Membership id and role are required.",
    });
  }

  try {
    await updatePartnerStaffRole({ membershipId, role });
  } catch (error) {
    redirectWithStatus("/dashboard/staff", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/staff");
  redirectWithStatus("/dashboard/staff", {
    success: "Staff role updated.",
  });
}

export async function updatePartnerSettingsAction(formData: FormData) {
  await requirePartnerSession();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    await patchPartnerSettings({
      displayName: displayName || undefined,
      supportEmail: supportEmail || undefined,
      notes: notes || undefined,
    });
  } catch (error) {
    redirectWithStatus("/dashboard/settings", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/settings");
  redirectWithStatus("/dashboard/settings", {
    success: "Partner settings updated.",
  });
}

export async function createRewardCatalogAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "rewards.manage")
  ) {
    redirectWithStatus("/dashboard/rewards", {
      error: "Your role cannot manage rewards.",
    });
  }

  const title = String(formData.get("title") ?? "").trim();
  const pointsCost = Number(formData.get("pointsCost") ?? 0);
  if (!title || pointsCost <= 0) {
    redirectWithStatus("/dashboard/rewards/create", {
      error: "Title and points cost are required.",
    });
  }

  const { createPartnerCatalogItem } = await import(
    "@/lib/platform/partnerCatalogPlatform"
  );

  try {
    const item = await createPartnerCatalogItem({
      title,
      pointsCost,
      description: String(formData.get("description") ?? "").trim() || undefined,
      status:
        String(formData.get("status") ?? "draft") === "active"
          ? "active"
          : "draft",
      sku: String(formData.get("sku") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      stockAvailable: Number(formData.get("stockAvailable") ?? 0) || undefined,
    });
    revalidatePath("/dashboard/rewards");
    redirectWithStatus(`/dashboard/rewards/${item.id}/edit`, {
      success: "Reward catalog item created.",
    });
  } catch (error) {
    redirectWithStatus("/dashboard/rewards/create", {
      error: mapPlatformError(error),
    });
  }
}

export async function updateRewardCatalogAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "rewards.manage")
  ) {
    redirectWithStatus("/dashboard/rewards", {
      error: "Your role cannot manage rewards.",
    });
  }

  const id = String(formData.get("catalogItemId") ?? "").trim();
  if (!id) {
    redirectWithStatus("/dashboard/rewards", { error: "Missing catalog item id." });
  }

  const { updatePartnerCatalogItem } = await import(
    "@/lib/platform/partnerCatalogPlatform"
  );

  const statusRaw = String(formData.get("status") ?? "");
  const status =
    statusRaw === "draft" ||
    statusRaw === "active" ||
    statusRaw === "paused" ||
    statusRaw === "archived"
      ? statusRaw
      : undefined;

  try {
    await updatePartnerCatalogItem(id, {
      title: String(formData.get("title") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      pointsCost: formData.get("pointsCost")
        ? Number(formData.get("pointsCost"))
        : undefined,
      status,
      sku: String(formData.get("sku") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      stockAvailable: formData.get("stockAvailable")
        ? Number(formData.get("stockAvailable"))
        : undefined,
    });
  } catch (error) {
    redirectWithStatus(`/dashboard/rewards/${id}/edit`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/rewards");
  redirectWithStatus(`/dashboard/rewards/${id}/edit`, {
    success: "Reward catalog item updated.",
  });
}

export async function updatePartnerNotificationPreferencesAction(formData: FormData) {
  const session = await requirePartnerSession();
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("partner");
  redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markPartnerNotificationsReadAction() {
  const session = await requirePartnerSession();
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markPartnerNotificationReadAction(formData: FormData) {
  const session = await requirePartnerSession();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

"use server";

import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { PlatformApiError } from "@/lib/platform/types";
import {
  listUserNotifications,
  markSingleNotificationRead,
  markUserNotificationsRead,
  persistNotificationsPreference,
  revalidateRoleNotificationPaths,
} from "@/lib/notifications";
import {
  confirmPartnerCollection,
  cancelPartnerFulfilment,
  importPartnerResourceCodes,
  invitePartnerStaff,
  updatePartnerStaffRole,
  validatePartnerToken,
} from "@/services/partner";

async function redirectWithStatus(path: string, params: Record<string, string>): Promise<never> {
  const locale = await getPartnerLocale();
  const search = new URLSearchParams(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, partnerText(locale, value)])));
  redirect(`${path}?${search.toString()}`);
}

function lifecycleVersion(form:FormData) {
  const value=form.get("expectedVersion");
  return typeof value==="string" && value.trim()!=="" ? Number(value) : NaN;
}

function mapPlatformError(error: unknown): string {
  if (error instanceof PlatformApiError) {
    if (error.status === 403 && /Admin approval required/i.test(error.message)) return "Only MOVRR can approve availability. Save this reward as a draft for review.";
    if (["Choose a valid JPEG, PNG or WebP image up to 3 MB.", "Image could not be uploaded. Please try again."].includes(error.message)) return error.message;
    if (error.status === 401 || error.status === 403) return "Your account cannot perform this action. Ask your manager for access.";
    if (error.kind === "AlreadyConfirmed") return "This collection was already confirmed.";
    if (error.kind === "ConcurrencyConflict" || error.status === 409) return "This reward changed. Refresh before trying again.";
    if (error.kind === "BusinessFailure" || error.kind === "validation" || error.kind === "not_found") return "This action is unavailable. Check the reward details and try again.";
  }
  return "We couldn't confirm the result. Refresh to check the current status before trying again.";
}

export async function confirmCollectionAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(
      session.partnerContext!.capabilities,
      "fulfilment.confirm",
    )
  ) {
    await redirectWithStatus("/dashboard/collections", {
      error: "Your role cannot confirm collections.",
    });
  }

  const fulfilmentId = String(formData.get("fulfilmentId") ?? "").trim();
  if (!fulfilmentId) {
    await redirectWithStatus("/dashboard/collections", {
      error: "Choose a reward to continue.",
    });
  }

  try {
    await confirmPartnerCollection(fulfilmentId, lifecycleVersion(formData), String(formData.get("reason") ?? ""), String(formData.get("operationId") ?? ""));
  } catch (error) {
    await redirectWithStatus(`/dashboard/collections/${fulfilmentId}`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${fulfilmentId}`);
  revalidatePath("/dashboard");
  await redirectWithStatus(`/dashboard/collections/${fulfilmentId}`, {
    success: "Collection confirmed.",
  });
}

export async function validateTokenAction(
  _previous: import("@/lib/partnerVoucher").VoucherValidationState,
  formData: FormData,
): Promise<import("@/lib/partnerVoucher").VoucherValidationState> {
  const session = await requirePartnerSession();
  if (!hasPartnerCapability(session.partnerContext!.capabilities, "fulfilment.validate")) {
    return { outcome: "restricted" };
  }
  const token = String(formData.get("token") ?? "").trim();
  const operationId = String(formData.get("operationId") ?? "");
  if (token.length < 32 || token.length > 512 || !/^[0-9a-f-]{36}$/i.test(operationId)) {
    return { outcome: "invalid" };
  }
  try {
    const result = await validatePartnerToken(token, operationId);
    if (result.fulfilment?.state !== "validated" || !/^[0-9a-f-]{36}$/i.test(result.fulfilmentId)) {
      return { outcome: "retry" };
    }
    revalidatePath("/dashboard/collections");
    revalidatePath(`/dashboard/collections/${result.fulfilmentId}`);
    revalidatePath("/dashboard");
    return { outcome: "validated", fulfilmentId: result.fulfilmentId };
  } catch (error) {
    if (error instanceof PlatformApiError) {
      if (error.status === 401 || error.status === 403) return { outcome: "restricted" };
      if (error.kind === "not_found") return { outcome: "invalid" };
      if (["BusinessFailure", "ConcurrencyConflict", "unavailable"].includes(error.kind)) return { outcome: "unavailable" };
    }
    return { outcome: "retry" };
  }
}

export async function cancelCollectionAction(formData:FormData) {
 const session=await requirePartnerSession();
 if(!hasPartnerCapability(session.partnerContext!.capabilities,"fulfilment.cancel"))await redirectWithStatus("/dashboard/collections",{error:"Your role cannot cancel rewards."});
 const id=String(formData.get("fulfilmentId")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id))await redirectWithStatus("/dashboard/collections",{error:"Invalid reward id."});
 try{await cancelPartnerFulfilment(id,lifecycleVersion(formData),String(formData.get("reason")??""),String(formData.get("operationId")??""));}
 catch(error){await redirectWithStatus(`/dashboard/collections/${id}`,{error:mapPlatformError(error)});}
 revalidatePath("/dashboard/collections");revalidatePath(`/dashboard/collections/${id}`);
 await redirectWithStatus("/dashboard/collections",{success:"Reward cancelled. Check the reward history for any refund."});
}

export async function importResourceCodesAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(
      session.partnerContext!.capabilities,
      "resources.manage",
    )
  ) {
    await redirectWithStatus("/dashboard/resources", {
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
    await redirectWithStatus("/dashboard/resources", {
      error: "Resource id and at least one code are required.",
    });
  }

  let imported: number;
  try {
    const result = await importPartnerResourceCodes({ resourceId, codes });
    imported = result.imported;
  } catch (error) {
    await redirectWithStatus("/dashboard/resources", {
      error: mapPlatformError(error),
    });
  }
  revalidatePath("/dashboard/resources");
  await redirectWithStatus("/dashboard/resources", { success: `Imported ${imported!} code(s).` });
}

export async function inviteStaffAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "staff.manage")
  ) {
    await redirectWithStatus("/dashboard/staff", {
      error: "Your role cannot manage staff.",
    });
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim();
  if (!email || !role) {
    await redirectWithStatus("/dashboard/staff", {
      error: "Email and role are required.",
    });
  }

  try {
    const operationToken = String(formData.get("operationToken") ?? "");
    const invitation = await invitePartnerStaff({ email, role, operationToken });
    (await cookies()).set("movrr-invitation", JSON.stringify({ actor: session.authUser.id, organisationId: session.partnerContext!.organisationId, url: invitation.url }),
      { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/dashboard/staff", maxAge: 600 });
  } catch (error) {
    await redirectWithStatus("/dashboard/staff", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/staff");
  await redirectWithStatus("/dashboard/staff", {
    success: "Staff member invited.",
  });
}

export async function updateStaffRoleAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "staff.manage")
  ) {
    await redirectWithStatus("/dashboard/staff", {
      error: "Your role cannot manage staff.",
    });
  }

  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!membershipId || !role) {
    await redirectWithStatus("/dashboard/staff", {
      error: "Membership id and role are required.",
    });
  }

  try {
    const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "");
    const rawStatus = formData.get("status");
    if (rawStatus !== null && rawStatus !== "revoked" && rawStatus !== "active") throw new Error("Invalid membership status");
    const status = rawStatus === "revoked" || rawStatus === "active" ? rawStatus : undefined;
    await updatePartnerStaffRole({ membershipId, role, expectedUpdatedAt, status });
  } catch (error) {
    await redirectWithStatus("/dashboard/staff", {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/staff");
  await redirectWithStatus("/dashboard/staff", {
    success: "Staff role updated.",
  });
}

export async function createRewardCatalogAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "rewards.manage")
  ) {
    await redirectWithStatus("/dashboard/rewards", {
      error: "Your role cannot manage rewards.",
    });
  }

  const title = String(formData.get("title") ?? "").trim();
  const rawPoints = String(formData.get("pointsCost") ?? "").trim();
  const pointsCost = rawPoints ? Number(rawPoints) : NaN;
  if (!title || !Number.isSafeInteger(pointsCost) || pointsCost < 0) {
    await redirectWithStatus("/dashboard/rewards/create", {
      error: "Title and points cost are required.",
    });
  }

  const { createPartnerCatalogItem } = await import(
    "@/lib/platform/partnerCatalogPlatform"
  );

  let createdId: string;
  let imageUploadFailed = false;
  try {
    const item = await createPartnerCatalogItem({
      title,
      pointsCost,
      description: String(formData.get("description") ?? "").trim() || undefined,
      status: "draft",
      sku: String(formData.get("sku") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      stockAvailable: formData.get("stockAvailable") ? Number(formData.get("stockAvailable")) : undefined,
    }, formData);
    createdId = item.id;
    imageUploadFailed = item.imageUploadFailed === true;
  } catch (error) {
    await redirectWithStatus("/dashboard/rewards/create", {
      error: mapPlatformError(error),
    });
  }
  revalidatePath("/dashboard/rewards");
  await redirectWithStatus(`/dashboard/rewards/${createdId!}/edit`, imageUploadFailed ? { error: "Reward saved, but the image could not be uploaded. Please choose the image again." } : { success: "Reward created." });
}

export async function updateRewardCatalogAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (
    !hasPartnerCapability(session.partnerContext!.capabilities, "rewards.manage")
  ) {
    await redirectWithStatus("/dashboard/rewards", {
      error: "Your role cannot manage rewards.",
    });
  }

  const id = String(formData.get("catalogItemId") ?? "").trim();
  if (!id) {
    await redirectWithStatus("/dashboard/rewards", { error: "Missing catalog item id." });
  }

  const { updatePartnerCatalogItem } = await import(
    "@/lib/platform/partnerCatalogPlatform"
  );

  const statusRaw = String(formData.get("status") ?? "");
  const status =
    statusRaw === "draft" ||
    statusRaw === "paused" ||
    statusRaw === "archived"
      ? statusRaw
      : undefined;

  if (!status) return await redirectWithStatus(`/dashboard/rewards/${id}/edit`, { error: "Only MOVRR can approve availability. Save this reward as a draft for review." });
  const { getPartnerCatalogItem } = await import("@/lib/platform/partnerCatalogPlatform");
  const current = await getPartnerCatalogItem(id);
  if (!current) return await redirectWithStatus("/dashboard/rewards", { error: "This reward is no longer available. Refresh your reward list." });
  if (current.status === "active" && formData.get("acknowledgeWithdrawal") !== "true") {
    await redirectWithStatus(`/dashboard/rewards/${id}/edit`, { error: "Confirm that saving will take this reward off sale before continuing." });
  }

  try {
    await updatePartnerCatalogItem(id, {
      expectedUpdatedAt: String(formData.get("expectedUpdatedAt") ?? ""),
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
    }, formData);
  } catch (error) {
    await redirectWithStatus(`/dashboard/rewards/${id}/edit`, {
      error: mapPlatformError(error),
    });
  }

  revalidatePath("/dashboard/rewards");
  await redirectWithStatus(`/dashboard/rewards/${id}/edit`, {
    success: status === "draft" ? "Draft saved. Contact MOVRR when your reward is ready for approval." : "Reward updated. It remains unavailable to riders.",
  });
}

export async function updatePartnerNotificationPreferencesAction(formData: FormData) {
  const session = await requirePartnerSession();
  const notifications = String(formData.get("productNotifications") ?? "false") === "true";

  await persistNotificationsPreference(session.appUser.id, notifications);
  revalidateRoleNotificationPaths("partner");
  await redirectWithStatus("/dashboard/notifications", { success: "Notification preference saved." });
}

export async function markPartnerNotificationsReadAction() {
  const session = await requirePartnerSession();
  await markUserNotificationsRead(session.appUser.id);
  revalidatePath("/dashboard/notifications");
  await redirectWithStatus("/dashboard/notifications", { success: "Notifications marked as read." });
}

export async function markPartnerNotificationReadAction(formData: FormData) {
  const session = await requirePartnerSession();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  await markSingleNotificationRead(session.appUser.id, notificationId);
  revalidatePath("/dashboard/notifications");
  await redirectWithStatus("/dashboard/notifications", { success: "Notification updated." });
}

export async function changePartnerLanguageAction(formData: FormData) {
  const session = await requirePartnerSession();
  const locale = formData.get("locale");
  if (locale !== "en" && locale !== "nl") return;
  (await cookies()).set("movrr-partner-locale", JSON.stringify({ actor: session.authUser.id, locale }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/dashboard", maxAge: 31536000,
  });
  revalidatePath("/dashboard", "layout");
}

/** Preview the same account inbox, without updating read state or accepting an identity. */
export async function getPartnerNotificationPreviewAction() {
  const session = await requirePartnerSession();
  return listUserNotifications(session.appUser.id, "partner", 5);
}

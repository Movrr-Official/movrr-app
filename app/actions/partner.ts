"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { PlatformApiError } from "@/lib/platform/types";
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

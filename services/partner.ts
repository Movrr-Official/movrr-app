/**
 * Thin Partner Platform API wrappers — no SQL fulfilment / business rules.
 */

import { requirePartnerSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import type {
  PartnerAnalytics,
  PartnerDashboard,
  PartnerPendingFulfilment,
  PartnerResource,
  PartnerReward,
  PartnerSettings,
  PartnerStaffMember,
} from "@/schemas";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function mapPendingItem(raw: unknown): PartnerPendingFulfilment {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    state: typeof row.state === "string" ? row.state : undefined,
    progress: typeof row.progress === "string" ? row.progress : undefined,
    fulfilmentType:
      typeof row.fulfilmentType === "string"
        ? row.fulfilmentType
        : typeof row.fulfilment_type === "string"
          ? row.fulfilment_type
          : undefined,
    catalogItemId:
      typeof row.catalogItemId === "string"
        ? row.catalogItemId
        : typeof row.catalog_item_id === "string"
          ? row.catalog_item_id
          : null,
    riderId:
      typeof row.riderId === "string"
        ? row.riderId
        : typeof row.rider_id === "string"
          ? row.rider_id
          : null,
    expiresAt:
      typeof row.expiresAt === "string"
        ? row.expiresAt
        : typeof row.expires_at === "string"
          ? row.expires_at
          : null,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : typeof row.created_at === "string"
          ? row.created_at
          : null,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : typeof row.updated_at === "string"
          ? row.updated_at
          : null,
  };
}

function mapResource(raw: unknown): PartnerResource {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    name: typeof row.name === "string" ? row.name : null,
    poolCount:
      typeof row.poolCount === "number"
        ? row.poolCount
        : typeof row.pool_count === "number"
          ? row.pool_count
          : null,
    availableCount:
      typeof row.availableCount === "number"
        ? row.availableCount
        : typeof row.available_count === "number"
          ? row.available_count
          : null,
    status: typeof row.status === "string" ? row.status : null,
  };
}

function mapReward(raw: unknown): PartnerReward {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    name: typeof row.name === "string" ? row.name : null,
    fulfilmentType:
      typeof row.fulfilmentType === "string"
        ? row.fulfilmentType
        : typeof row.fulfilment_type === "string"
          ? row.fulfilment_type
          : null,
    status: typeof row.status === "string" ? row.status : null,
    pointsCost:
      typeof row.pointsCost === "number"
        ? row.pointsCost
        : typeof row.points_cost === "number"
          ? row.points_cost
          : null,
  };
}

function mapStaff(raw: unknown): PartnerStaffMember {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    organisationId:
      typeof row.organisationId === "string"
        ? row.organisationId
        : typeof row.organisation_id === "string"
          ? row.organisation_id
          : undefined,
    userId: String(row.userId ?? row.user_id ?? ""),
    role: String(row.role ?? "viewer"),
    status: typeof row.status === "string" ? row.status : null,
    email: typeof row.email === "string" ? row.email : null,
    name: typeof row.name === "string" ? row.name : null,
  };
}

export async function getPartnerDashboard(): Promise<PartnerDashboard> {
  const session = await requirePartnerSession();
  const ctx = session.partnerContext!;

  const [pending, analytics] = await Promise.all([
    hasPartnerCapability(ctx.capabilities, "fulfilment.read")
      ? platformFetch<unknown[]>("/partners/fulfilments/pending").catch(
          () => [] as unknown[],
        )
      : Promise.resolve([] as unknown[]),
    hasPartnerCapability(ctx.capabilities, "analytics.view")
      ? platformFetch<{ series?: unknown[] }>("/partners/analytics").catch(
          () => ({ series: [] }),
        )
      : Promise.resolve({ series: [] }),
  ]);

  const pendingItems = Array.isArray(pending) ? pending : [];
  const series = Array.isArray(analytics?.series) ? analytics.series : [];

  return {
    organisationId: ctx.organisationId,
    membershipRole: ctx.membershipRole,
    pendingCount: pendingItems.length,
    failureRateLabel: "—",
    analyticsSeriesCount: series.length,
  };
}

export async function listPartnerPendingFulfilments(): Promise<
  PartnerPendingFulfilment[]
> {
  await requirePartnerSession();
  const data = await platformFetch<unknown[]>("/partners/fulfilments/pending");
  return (Array.isArray(data) ? data : [])
    .map(mapPendingItem)
    .filter((item) => item.id);
}

export async function getPartnerPendingFulfilment(
  id: string,
): Promise<PartnerPendingFulfilment | null> {
  const items = await listPartnerPendingFulfilments();
  return items.find((item) => item.id === id) ?? null;
}

export async function confirmPartnerCollection(fulfilmentId: string) {
  await requirePartnerSession();
  return platformFetch<unknown>("/partners/collections/confirm", {
    method: "POST",
    body: { fulfilmentId },
    idempotencyKey: createCorrelationId(),
  });
}

export async function validatePartnerToken(token: string) {
  await requirePartnerSession();
  return platformFetch<unknown>("/partners/validate", {
    method: "POST",
    body: { token },
    idempotencyKey: createCorrelationId(),
  });
}

export async function listPartnerResources(): Promise<PartnerResource[]> {
  await requirePartnerSession();
  const data = await platformFetch<unknown[]>("/partners/resources");
  return (Array.isArray(data) ? data : []).map(mapResource).filter((r) => r.id);
}

export async function importPartnerResourceCodes(input: {
  resourceId: string;
  codes: string[];
}) {
  await requirePartnerSession();
  return platformFetch<{
    resourceId: string;
    imported: number;
    accepted: boolean;
  }>("/partners/resources", {
    method: "POST",
    body: input,
    idempotencyKey: createCorrelationId(),
  });
}

export async function listPartnerRewards(): Promise<PartnerReward[]> {
  await requirePartnerSession();
  const data = await platformFetch<unknown[]>("/partners/rewards");
  return (Array.isArray(data) ? data : []).map(mapReward).filter((r) => r.id);
}

export async function listPartnerStaff(): Promise<PartnerStaffMember[]> {
  const session = await requirePartnerSession();
  const orgId = session.partnerContext!.organisationId;
  // Prefer org-scoped staff endpoint (supports mutations); fall back to partners/staff.
  try {
    const data = await platformFetch<unknown[]>(
      `/organisations/${orgId}/staff`,
    );
    return (Array.isArray(data) ? data : [])
      .map(mapStaff)
      .filter((m) => m.id && m.userId);
  } catch {
    const data = await platformFetch<unknown[]>("/partners/staff");
    return (Array.isArray(data) ? data : [])
      .map(mapStaff)
      .filter((m) => m.id && m.userId);
  }
}

export async function invitePartnerStaff(input: {
  userId: string;
  role: string;
}) {
  const session = await requirePartnerSession();
  const orgId = session.partnerContext!.organisationId;
  return platformFetch<unknown>(`/organisations/${orgId}/staff`, {
    method: "POST",
    body: input,
  });
}

export async function updatePartnerStaffRole(input: {
  membershipId: string;
  role: string;
}) {
  const session = await requirePartnerSession();
  const orgId = session.partnerContext!.organisationId;
  return platformFetch<unknown>(`/organisations/${orgId}/staff`, {
    method: "PATCH",
    body: input,
  });
}

export async function getPartnerAnalytics(): Promise<PartnerAnalytics> {
  await requirePartnerSession();
  const data = await platformFetch<{ series?: unknown[] }>(
    "/partners/analytics",
  );
  return {
    series: Array.isArray(data?.series)
      ? data.series.map((item) => asRecord(item))
      : [],
  };
}

export async function getPartnerSettings(): Promise<PartnerSettings> {
  await requirePartnerSession();
  const data = await platformFetch<Record<string, unknown>>(
    "/partners/settings",
  );
  return data && typeof data === "object" ? data : {};
}

export async function patchPartnerSettings(settings: Record<string, unknown>) {
  await requirePartnerSession();
  return platformFetch<Record<string, unknown>>("/partners/settings", {
    method: "PATCH",
    body: settings,
  });
}

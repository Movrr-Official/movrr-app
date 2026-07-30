/**
 * Advertiser campaign Platform API wrappers.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";
import type { CampaignLifecycleStatus } from "@/lib/platform/capabilityRegistry.types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type PlatformCampaign = {
  id: string;
  name: string;
  description?: string;
  lifecycleStatus: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  campaignType?: string;
  targetZones: string[];
  impressions?: number;
  qrScans?: number;
  maxRiders?: number;
};

export type CreateCampaignInput = {
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  campaignType?: "swarm" | "destination_ride";
  targetZones?: string[];
  vehicleTypeRequired?: "bike" | "e-bike" | "cargo-bike";
  deliveryMode?: "manual" | "automated";
  impressionGoal?: number;
};

export type UpdateCampaignInput = Partial<CreateCampaignInput> & {
  status?: CampaignLifecycleStatus;
};

function mapCampaign(raw: unknown): PlatformCampaign {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Campaign"),
    description:
      typeof row.description === "string" ? row.description : undefined,
    lifecycleStatus: String(
      row.lifecycleStatus ?? row.lifecycle_status ?? "draft",
    ),
    budget:
      typeof row.budget === "number" ? row.budget : Number(row.budget ?? 0),
    startDate:
      typeof row.startDate === "string"
        ? row.startDate
        : typeof row.start_date === "string"
          ? row.start_date
          : undefined,
    endDate:
      typeof row.endDate === "string"
        ? row.endDate
        : typeof row.end_date === "string"
          ? row.end_date
          : undefined,
    campaignType:
      typeof row.campaignType === "string"
        ? row.campaignType
        : typeof row.campaign_type === "string"
          ? row.campaign_type
          : undefined,
    targetZones: Array.isArray(row.targetZones)
      ? row.targetZones.filter((z): z is string => typeof z === "string")
      : Array.isArray(row.target_zones)
        ? row.target_zones.filter((z): z is string => typeof z === "string")
        : [],
    impressions:
      typeof row.impressions === "number"
        ? row.impressions
        : Number(row.impressions ?? 0),
    qrScans:
      typeof row.qrScans === "number"
        ? row.qrScans
        : Number(row.qr_scans ?? 0),
    maxRiders:
      typeof row.maxRiders === "number"
        ? row.maxRiders
        : Number(row.max_riders ?? 0),
  };
}

export async function listAdvertiserCampaigns(): Promise<PlatformCampaign[]> {
  await requireProductSession(["advertiser"]);
  const data = await platformFetch<unknown[]>("/campaigns");
  return (Array.isArray(data) ? data : [])
    .map(mapCampaign)
    .filter((item) => item.id);
}

export async function getAdvertiserCampaign(
  id: string,
): Promise<PlatformCampaign | null> {
  await requireProductSession(["advertiser"]);
  try {
    const data = await platformFetch<unknown>(`/campaigns/${id}`);
    const mapped = mapCampaign(data);
    return mapped.id ? mapped : null;
  } catch {
    return null;
  }
}

export async function createAdvertiserCampaign(input: CreateCampaignInput) {
  await requireProductSession(["advertiser"]);
  return platformFetch<unknown>("/campaigns", {
    method: "POST",
    body: input,
    idempotencyKey: createCorrelationId(),
  });
}

export async function updateAdvertiserCampaign(
  id: string,
  input: UpdateCampaignInput,
) {
  await requireProductSession(["advertiser"]);
  return platformFetch<unknown>(`/campaigns/${id}`, {
    method: "PATCH",
    body: input,
    idempotencyKey: createCorrelationId(),
  });
}

export async function updateAdvertiserCampaignStatus(
  id: string,
  status: CampaignLifecycleStatus,
) {
  await requireProductSession(["advertiser"]);
  return platformFetch<unknown>(`/campaigns/${id}/status`, {
    method: "POST",
    body: { status },
    idempotencyKey: createCorrelationId(),
  });
}

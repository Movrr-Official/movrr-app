/**
 * Rider campaign Platform API wrappers.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type RiderCampaignItem = {
  id: string;
  name: string;
  description?: string;
  lifecycleStatus: string;
  campaignType?: string;
  startDate?: string;
  endDate?: string;
  signupStatus?: string;
  targetZones: string[];
};

function mapRiderCampaign(raw: unknown): RiderCampaignItem {
  const row = asRecord(raw);
  const signup = asRecord(row.campaign_signup ?? row.signup);
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Campaign"),
    description:
      typeof row.description === "string" ? row.description : undefined,
    lifecycleStatus: String(
      row.lifecycleStatus ?? row.lifecycle_status ?? "draft",
    ),
    campaignType:
      typeof row.campaignType === "string"
        ? row.campaignType
        : typeof row.campaign_type === "string"
          ? row.campaign_type
          : undefined,
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
    signupStatus:
      typeof signup.status === "string"
        ? signup.status
        : typeof row.signupStatus === "string"
          ? row.signupStatus
          : undefined,
    targetZones: Array.isArray(row.targetZones)
      ? row.targetZones.filter((z): z is string => typeof z === "string")
      : Array.isArray(row.target_zones)
        ? row.target_zones.filter((z): z is string => typeof z === "string")
        : [],
  };
}

export async function listRiderCampaigns(): Promise<RiderCampaignItem[]> {
  await requireProductSession(["rider"]);
  const data = await platformFetch<unknown[]>("/riders/me/campaigns");
  return (Array.isArray(data) ? data : [])
    .map(mapRiderCampaign)
    .filter((item) => item.id);
}

export async function optInToCampaign(campaignId: string) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>("/riders/me/campaigns/opt-in", {
    method: "POST",
    body: { campaignId },
    idempotencyKey: createCorrelationId(),
  });
}

export async function withdrawCampaignSignup(campaignId: string) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>("/riders/me/campaigns/withdraw", {
    method: "POST",
    body: { campaignId },
    idempotencyKey: createCorrelationId(),
  });
}

export async function confirmCampaignParticipation(campaignId: string) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>("/riders/me/campaigns/confirm", {
    method: "POST",
    body: { campaignId },
    idempotencyKey: createCorrelationId(),
  });
}

/**
 * Government Platform API wrappers.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "@/lib/platform/client";
import type { GovernmentProgrammesResponse } from "@/schemas";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type GovernmentProfile = {
  organisationId: string;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  role?: string | null;
};

export async function getGovernmentMe(): Promise<GovernmentProfile> {
  await requireProductSession(["government"]);
  const data = await platformFetch<unknown>("/government/me");
  const row = asRecord(data);
  return {
    organisationId: String(row.organisationId ?? row.organisation_id ?? ""),
    name: typeof row.name === "string" ? row.name : null,
    type: typeof row.type === "string" ? row.type : null,
    status: typeof row.status === "string" ? row.status : null,
    role: typeof row.role === "string" ? row.role : null,
  };
}

export async function getGovernmentProgrammes(): Promise<GovernmentProgrammesResponse> {
  await requireProductSession(["government"]);
  const data = await platformFetch<unknown>("/government/programmes");
  const row = asRecord(data);
  const kpis = asRecord(row.kpis);
  const compliance = asRecord(row.complianceSummary ?? row.compliance_summary);
  return {
    kpis: {
      activeCampaigns: Number(kpis.activeCampaigns ?? kpis.active_campaigns ?? 0),
      totalImpressions: Number(
        kpis.totalImpressions ?? kpis.total_impressions ?? 0,
      ),
      verifiedRides: Number(kpis.verifiedRides ?? kpis.verified_rides ?? 0),
      pendingVerification: Number(
        kpis.pendingVerification ?? kpis.pending_verification ?? 0,
      ),
    },
    campaigns: Array.isArray(row.campaigns)
      ? row.campaigns.map((c) => asRecord(c))
      : [],
    complianceSummary: {
      verifiedRides: Number(
        compliance.verifiedRides ?? compliance.verified_rides ?? 0,
      ),
      pendingReview: Number(
        compliance.pendingReview ?? compliance.pending_review ?? 0,
      ),
      rejectedRides: Number(
        compliance.rejectedRides ?? compliance.rejected_rides ?? 0,
      ),
    },
  };
}

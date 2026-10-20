/**
 * Rider campaign Platform API wrappers.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";

import { z } from "zod";
const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  lifecycleStatus: z.string(),
  campaignType: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  targetZones: z.array(z.string()),
  signupStatus: z.string().nullable(),
  canJoin: z.boolean(),
  canWithdraw: z.boolean(),
  canConfirm: z.boolean(),
});
export type RiderCampaignItem = z.infer<typeof campaignSchema>;
export async function listRiderCampaigns(): Promise<RiderCampaignItem[]> {
  await requireProductSession(["rider"]);
  return z.array(campaignSchema).parse(await platformFetch("/riders/me/campaigns"));
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

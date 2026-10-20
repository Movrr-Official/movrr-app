import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "./client";
export const rideSummarySchema = z.object({
  contractVersion: z.literal(1),
  rideSessionId: z.string().uuid(),
  session: z
    .object({
      id: z.string().uuid(),
      rider_id: z.string().uuid(),
      route_id: z.string().uuid().nullable().optional(),
      route_name: z.string().nullable().optional(),
      status: z.string(),
      earning_mode: z.string().nullable().optional(),
      started_at: z.string(),
      completed_at: z.string().nullable().optional(),
      total_distance_meters: z.number().nullable().optional(),
      duration_ms: z.number().nullable().optional(),
      compliance_score: z.number().nullable().optional(),
      verification_result: z
        // Historical evidence can lack status; preserve absence without inventing verification.
        .object({ status: z.string().optional() })
        .passthrough()
        .nullable()
        .optional(),
    })
    .passthrough(),
  settlement: z
    .object({
      status: z.string(),
      completeness: z.string().optional(),
      reason_code: z.string().nullable().optional(),
    })
    .passthrough(),
  committedPoints: z.number().nullable(),
  totalPoints: z.number().nullable(),
  transactions: z.array(
    z
      .object({
        points_earned: z.number().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough(),
  ),
});
export type RideSummary = z.infer<typeof rideSummarySchema>;
export async function listRideSummaries(cursor?: string, routeId?: string) {
  await requireProductSession(["rider"]);
  return z
    .object({
      summaries: z.array(rideSummarySchema),
      nextCursor: z.object({ at: z.string(), id: z.string().uuid() }).nullable(),
    })
    .parse(
      await platformFetch(
        `/riders/me/rides?${new URLSearchParams({ ...(cursor ? { cursor } : {}), ...(routeId ? { routeId } : {}) })}`,
      ),
    );
}
export async function getRideSummary(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return rideSummarySchema
    .nullable()
    .parse(await platformFetch(`/riders/me/rides?id=${id}`));
}
export async function readRiderFeature(
  feature: "accessories" | "brands" | "achievements" | "impact",
) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>(`/riders/me/${feature}`);
}

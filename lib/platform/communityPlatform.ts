import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "./client";
export const communityRideSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.string(),
  meeting_point_name: z.string().nullable(),
  category: z.string(),
  max_participants: z.number(),
  status: z.string(),
  updated_at: z.string(),
  isOrganizer: z.boolean(),
  isJoined: z.boolean(),
});
export async function listCommunityRides() {
  await requireProductSession(["rider"]);
  return z.array(communityRideSchema).parse(await platformFetch("/community-rides"));
}
export type CommunityRide = z.infer<typeof communityRideSchema>;
export type CommunityInput = {
  title: string;
  description?: string;
  scheduledAt: string;
  meetingPoint?: string;
  category?: string;
  maxParticipants?: number;
};
export async function createCommunityRide(
  input: CommunityInput & { operationId: string },
) {
  await requireProductSession(["rider"]);
  return platformFetch("/community-rides", { method: "POST", body: input });
}
export async function joinCommunityRide(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return platformFetch(`/community-rides/${id}/join`, { method: "POST", body: {} });
}
export async function leaveCommunityRide(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return platformFetch(`/community-rides/${id}/leave`, { method: "POST", body: {} });
}
export async function editCommunityRide(
  id: string,
  input: CommunityInput & { expectedUpdatedAt: string },
) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return platformFetch(`/community-rides/${id}`, { method: "PATCH", body: input });
}
export async function cancelCommunityRide(id: string, expectedUpdatedAt: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return platformFetch(`/community-rides/${id}/cancel`, {
    method: "POST",
    body: { expectedUpdatedAt },
  });
}

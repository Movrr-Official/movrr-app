/**
 * Community rides Platform API wrappers.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type CommunityRide = {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  meetingPoint?: string;
  category?: string;
  maxParticipants?: number;
  status?: string;
  participantCount?: number;
};

function mapCommunityRide(raw: unknown): CommunityRide {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Community ride"),
    description:
      typeof row.description === "string" ? row.description : undefined,
    scheduledAt:
      typeof row.scheduledAt === "string"
        ? row.scheduledAt
        : typeof row.scheduled_at === "string"
          ? row.scheduled_at
          : undefined,
    meetingPoint:
      typeof row.meetingPoint === "string"
        ? row.meetingPoint
        : typeof row.meeting_point === "string"
          ? row.meeting_point
          : undefined,
    category: typeof row.category === "string" ? row.category : undefined,
    maxParticipants:
      typeof row.maxParticipants === "number"
        ? row.maxParticipants
        : typeof row.max_participants === "number"
          ? row.max_participants
          : undefined,
    status: typeof row.status === "string" ? row.status : undefined,
    participantCount:
      typeof row.participantCount === "number"
        ? row.participantCount
        : typeof row.participant_count === "number"
          ? row.participant_count
          : undefined,
  };
}

export async function listCommunityRides(): Promise<CommunityRide[]> {
  await requireProductSession(["rider"]);
  const data = await platformFetch<unknown[]>("/community-rides");
  return (Array.isArray(data) ? data : [])
    .map(mapCommunityRide)
    .filter((item) => item.id);
}

export async function createCommunityRide(input: {
  title: string;
  description?: string;
  scheduledAt: string;
  meetingPoint?: string;
  category?: string;
  maxParticipants?: number;
}) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>("/community-rides", {
    method: "POST",
    body: input,
    idempotencyKey: createCorrelationId(),
  });
}

export async function joinCommunityRide(communityRideId: string) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>(`/community-rides/${communityRideId}/join`, {
    method: "POST",
    body: {},
    idempotencyKey: createCorrelationId(),
  });
}

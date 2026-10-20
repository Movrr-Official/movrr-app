import { SUPPORT_EMAIL } from "@/lib/env";
import { requireProductSession } from "@/lib/appUser";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getWalletStatement } from "@/lib/platform/riderPlatform";
import { listRiderCampaigns } from "@/lib/platform/campaignPlatform";
import { listRideSummaries } from "@/lib/platform/riderSelfService";
import {
  listUserNotifications,
  getUserNotificationPreferences,
} from "@/lib/notifications";
import type { RiderDashboard, RiderRoute } from "@/schemas";
async function ownedAssignments(riderId: string) {
  const db = await createSupabaseServerClient();
  const all: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db
      .from("rider_route")
      .select(
        "id,route_id,campaign_id,status,assigned_at,started_at,completed_at,updated_at,progress,route:route_id(id,name,city,start_lat,start_lng,end_lat,end_lng,coverage_km,description,estimated_duration_minutes)",
      )
      .eq("rider_id", riderId)
      .order("assigned_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new Error("Route assignments unavailable");
    all.push(...data);
    if (data.length < 500) break;
  }
  return all;
}
function assignment(row: Record<string, unknown>): RiderRoute {
  const route = row.route as Record<
    string,
    unknown
  > | null;
  return {
    id: String(row.route_id),
    riderRouteId: String(row.id),
    name: String(route?.name ?? "Assigned route"),
    status: String(row.status),
    city: typeof route?.city === "string" ? route.city : undefined,
    startedAt: row.started_at as string | null,
    completedAt: row.completed_at as string | null,
    routeProgress: typeof row.progress === "number" ? row.progress : null,
    coverageKm: Number(route?.coverage_km ?? 0),
    campaignId: row.campaign_id as string | null,
    lastSyncedAt: row.updated_at as string | null,
    complianceStatus: "unavailable",
    syncSource: "assignment",
    timeline: [
      ["assigned_at", "Route assigned"], ["started_at", "Route started"], ["completed_at", "Route completed"]
    ].filter(([key]) => typeof row[key] === "string").map(([key,label]) => ({ id:`${row.id}:${key}`,label,detail:"Recorded assignment event",occurredAt:String(row[key]),tone:"default" as const })),
  };
}
export async function getRiderDashboardData(): Promise<RiderDashboard> {
  const session = await requireProductSession(["rider"]);
  const rider = session.riderProfile;
  if (!rider) throw new Error("Rider onboarding is incomplete. Contact MOVRR support.");
  const [statement, campaigns, rows, notifications, productNotifications, rides] =
    await Promise.all([
      getWalletStatement(),
      listRiderCampaigns(),
      ownedAssignments(rider.id),
      listUserNotifications(session.appUser.id, "rider"),
      getUserNotificationPreferences(session.appUser.id),
      listRideSummaries(),
    ]);
  const { balance: wallet, entries } = statement;
  const routes = rows.map(assignment);
  const rewards = entries.map((row) => ({
    id: row.id,
    type:
      row.category === "redemption"
        ? ("redeemed" as const)
        : row.category === "adjustment" || row.category === "refund" || row.points < 0
          ? ("adjusted" as const)
          : ("awarded" as const),
    category: row.category,
    points: row.points,
    description: row.description,
    createdAt: row.createdAt,
  }));
  const latest = rides.summaries[0];
  const compliance = latest?.session.compliance_score;
  return {
    riderId: rider.id,
    pointsBalance: wallet.pointsBalance,
    lifetimePointsEarned: wallet.lifetimePointsEarned,
    activeCampaigns: campaigns.filter(
      (c) => c.lifecycleStatus === "active" && c.signupStatus === "confirmed",
    ).length,
    activeRoutes: routes.filter((r) => ["assigned", "in-progress"].includes(r.status))
      .length,
    currentCompliance: typeof compliance === "number" ? compliance * 100 : null,
    complianceStatus:
      typeof compliance === "number"
        ? compliance >= 0.8
          ? "healthy"
          : compliance >= 0.5
            ? "watch"
            : "attention"
        : "unavailable",
    lastActive: session.authUser.last_sign_in_at ?? null,
    lastMobileSyncAt: latest?.session.completed_at ?? latest?.session.started_at ?? null,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      status: c.lifecycleStatus,
      campaignType: c.campaignType ?? undefined,
      startDate: c.startDate ?? undefined,
      endDate: c.endDate ?? undefined,
      targetZones: c.targetZones,
      qrScans: null,
      impressions: null,
    })),
    routes,
    rewards,
    rewardsSummary: {
      availablePoints: wallet.pointsBalance,
      lifetimePointsEarned: wallet.lifetimePointsEarned,
      awardedPoints: entries
        .filter((e) => !["redemption", "adjustment", "refund"].includes(e.category) && e.points > 0)
        .reduce((s, e) => s + e.points, 0),
      redeemedPoints: -entries
        .filter((e) => e.category === "redemption")
        .reduce((s, e) => s + e.points, 0),
      adjustmentPoints: entries
        .filter((e) => (["adjustment", "refund"].includes(e.category) || (e.category !== "redemption" && e.points < 0)))
        .reduce((s, e) => s + e.points, 0),
    },
    notifications,
    preferences: { productNotifications },
    profile: {
      riderId: rider.id,
      email: session.appUser.email,
      city: rider.city,
      country: rider.country,
      isCertified: !!rider.is_certified,
      accountNotes: null,
      vehicleType: rider.vehicle_type,
      emergencyContact: rider.emergency_contact,
      emergencyPhone: rider.emergency_phone,
      languagePreference: session.appUser.languagePreference,
      timezone: "Europe/Amsterdam",
    },
    support: {
      supportEmail: SUPPORT_EMAIL,
      helpLabel: "Contact MOVRR support for ride or account assistance.",
    },
  };
}
/** Assigned routes do not depend on Wallet, campaigns or notification services. */
export async function getRiderRoutesData() {
  const session = await requireProductSession(["rider"]);
  if (!session.riderProfile) throw new Error("Rider onboarding is incomplete. Contact MOVRR support.");
  const [rows, rides] = await Promise.all([
    ownedAssignments(session.riderProfile.id),
    listRideSummaries(),
  ]);
  const routes = rows.map(assignment);
  const latest = rides.summaries[0];
  const compliance = latest?.session.compliance_score;
  return {
    routes,
    activeRoutes: routes.filter(route => ["assigned", "in-progress"].includes(route.status)).length,
    currentCompliance: typeof compliance === "number" ? compliance * 100 : null,
    lastMobileSyncAt: latest?.session.completed_at ?? latest?.session.started_at ?? null,
  };
}

/** Settings must remain available independently of ride and financial services. */
export async function getRiderSettingsData() {
  const session = await requireProductSession(["rider"]);
  const rider = session.riderProfile;
  if (!rider) throw new Error("Rider onboarding is incomplete. Contact MOVRR support.");
  const productNotifications = await getUserNotificationPreferences(session.appUser.id);
  return {
    profile: {
      email: session.appUser.email,
      city: rider.city,
      country: rider.country,
      vehicleType: rider.vehicle_type,
      emergencyContact: rider.emergency_contact,
      emergencyPhone: rider.emergency_phone,
      languagePreference: session.appUser.languagePreference,
      timezone: "Europe/Amsterdam",
      accountNotes: null,
    },
    preferences: { productNotifications },
    support: { supportEmail: SUPPORT_EMAIL },
  };
}

export async function getRiderNotificationsData() {
  const session = await requireProductSession(["rider"]);
  const [notifications, productNotifications] = await Promise.all([
    listUserNotifications(session.appUser.id, "rider"),
    getUserNotificationPreferences(session.appUser.id),
  ]);
  return {
    notifications,
    preferences: { productNotifications },
    support: {
      supportEmail: SUPPORT_EMAIL,
      helpLabel: "Contact MOVRR support for ride or account assistance.",
    },
  };
}
export async function getRiderRouteDetail(routeId: string) {
  const session = await requireProductSession(["rider"]);
  if (!session.riderProfile) return null;
  const rows = await ownedAssignments(session.riderProfile.id);
  const row = rows.find((r) => r.route_id === routeId);
  if (!row) return null;
  const r = row.route as Record<
    string,
    unknown
  > | null;
  const route = assignment(row);
  const history: import("@/lib/platform/riderSelfService").RideSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await listRideSummaries(cursor, routeId);
    history.push(...page.summaries);
    cursor = page.nextCursor
      ? Buffer.from(JSON.stringify(page.nextCursor)).toString("base64url")
      : undefined;
  } while (cursor);
  const measured = history.filter(
    (x) => typeof x.session.total_distance_meters === "number",
  );
  const db = await createSupabaseServerClient();
  const geography = row.campaign_id
    ? await db.rpc("get_campaign_geography", { p_campaign_id: row.campaign_id })
    : { data: { zones: [] }, error: null };
  if (geography.error) throw new Error("Campaign geography unavailable");
  const hot = row.campaign_id
    ? await db
        .from("campaign_hot_zone")
        .select("id,name,bonus_percent")
        .eq("campaign_id", row.campaign_id)
    : { data: [], error: null };
  if (hot.error) throw new Error("Hot zones unavailable");
  return {
    ...route,
    description: r?.description as string | null,
    startLocation:
      typeof r?.start_lat === "number" ? `${r.start_lat}, ${r.start_lng}` : null,
    endLocation: typeof r?.end_lat === "number" ? `${r.end_lat}, ${r.end_lng}` : null,
    estimatedDurationMinutes:
      typeof r?.estimated_duration_minutes === "number"
        ? r.estimated_duration_minutes
        : null,
    verifiedMinutes: history.length
      ? history.reduce(
          (sum, x) =>
            sum +
            Math.max(
              0,
              ...x.transactions.map((t) => Number(t.metadata?.verifiedMinutes ?? 0)),
            ),
          0,
        )
      : null,
    distanceKm: measured.length
      ? measured.reduce((sum, x) => sum + (x.session.total_distance_meters ?? 0), 0) /
        1000
      : null,
    impressions: null,
    campaignZones: (geography.data?.zones ?? []) as Array<{ id: string; name: string }>,
    hotZones: hot.data ?? [],
    tracking: history,
  };
}

import { SUPPORT_EMAIL } from "@/lib/env";
import { requireProductSession } from "@/lib/appUser";
import { getComplianceStatus, resolveLatestTimestamp } from "@/lib/product-freshness";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { RiderDashboard, RiderRewardTransaction, RiderRoute, RiderTimelineEvent } from "@/schemas";

function calculateRouteProgress(status?: string | null) {
  if (status === "completed") return 100;
  if (status === "in-progress") return 55;
  if (status === "assigned") return 10;
  return 0;
}

function mapNotificationCategory(type?: string | null) {
  if (!type) return "general";
  if (type.includes("campaign")) return "campaign";
  if (type.includes("route")) return "route";
  if (type.includes("reward")) return "reward";
  return "account";
}

function mapRewardCategory(source?: string | null): RiderRewardTransaction["category"] {
  if (source === "adjustment") return "adjustment";
  if (source === "redemption") return "redemption";
  if (source === "campaign") return "campaign";
  if (source === "route") return "route";
  return "other";
}

type RiderProfileRow = {
  id: string;
  city?: string | null;
  country?: string | null;
  vehicle_type?: string | null;
  is_certified?: boolean | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
};

async function getRiderProfileRows(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await admin
    .from("rider")
    .select(
      "id, city, country, vehicle_type, is_certified, emergency_contact, emergency_phone, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as RiderProfileRow[]).filter((row) => Boolean(row.id));
}

export async function getRiderDashboardData(): Promise<RiderDashboard> {
  const session = await requireProductSession(["rider"]);
  const admin = createSupabaseAdminClient();
  const { data: userPreferences } = await admin
    .from("user_preferences")
    .select("notifications")
    .eq("user_id", session.appUser.id)
    .maybeSingle();

  const riderRows = await getRiderProfileRows(admin, session.appUser.id);
  const riderIds = Array.from(new Set(riderRows.map((row) => row.id)));
  const resolvedProfile =
    riderRows.find((row) => row.id === session.riderProfile?.id) ??
    riderRows[0] ??
    session.riderProfile ??
    null;
  const riderId = resolvedProfile?.id ?? "";

  if (!riderIds.length) {
    return {
      riderId: "",
      pointsBalance: 0,
      lifetimePointsEarned: 0,
      activeCampaigns: 0,
      activeRoutes: 0,
      currentCompliance: 0,
      complianceStatus: "watch",
      lastActive: null,
      lastMobileSyncAt: null,
      campaigns: [],
      routes: [],
      rewards: [],
      rewardsSummary: {
        availablePoints: 0,
        lifetimePointsEarned: 0,
        awardedPoints: 0,
        redeemedPoints: 0,
        adjustmentPoints: 0,
      },
      notifications: [],
      preferences: {
        productNotifications: userPreferences?.notifications ?? true,
      },
      profile: {
        riderId: "",
        email: session.appUser.email,
        city: null,
        country: null,
        isCertified: false,
        accountNotes: null,
        vehicleType: null,
        emergencyContact: null,
        emergencyPhone: null,
        languagePreference: session.appUser.languagePreference,
        timezone: "Europe/Amsterdam",
      },
      support: {
        supportEmail: SUPPORT_EMAIL,
        helpLabel: "Contact MOVRR support for route execution issues or account assistance.",
      },
    };
  }

  const [assignmentsRes, signupsRes, routeAssignmentsRes, balanceRes, rewardsRes, notificationsRes] =
    await Promise.all([
      admin
        .from("campaign_assignment")
        .select("rider_id, campaign_id")
        .in("rider_id", riderIds),
      admin
        .from("campaign_signup")
        .select("rider_id, campaign_id, status")
        .in("rider_id", riderIds),
      admin
        .from("rider_route")
        .select("id, rider_id, route_id, campaign_id, status, assigned_at, started_at, completed_at, updated_at, progress")
        .in("rider_id", riderIds)
        .order("assigned_at", { ascending: false }),
      admin
        .from("rider_reward_balance")
        .select("rider_id, points_balance, lifetime_points_earned")
        .in("rider_id", riderIds),
      admin
        .from("reward_transactions")
        .select("id, points_earned, source, metadata, created_at")
        .in("rider_id", riderIds)
        .order("created_at", { ascending: false })
        .limit(25),
      admin
        .from("notifications")
        .select("id, title, message, type, is_read, created_at")
        .eq("user_id", session.appUser.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  const routeRows = routeAssignmentsRes.data ?? [];
  const routeIds = routeRows.map((row: any) => row.route_id).filter(Boolean);
  const { data: trackingRows } = routeIds.length
    ? await admin
        .from("route_tracking")
        .select("id, route_id, start_time, end_time, total_distance, route_compliance, impressions_earned")
        .in("rider_id", riderIds)
        .in("route_id", routeIds)
        .order("start_time", { ascending: false })
    : { data: [] };

  const trackingByRoute = new Map<string, any[]>();
  (trackingRows ?? []).forEach((row: any) => {
    const key = row.route_id;
    if (!trackingByRoute.has(key)) trackingByRoute.set(key, []);
    trackingByRoute.get(key)?.push(row);
  });

  const { data: routeDetails } = routeIds.length
    ? await admin
        .from("route")
        .select(
          "id, name, city, start_lat, start_lng, end_lat, end_lng, estimated_duration_minutes, coverage_km, campaign_id",
        )
        .in("id", routeIds)
    : { data: [] as any[] };

  const campaignIds = Array.from(
    new Set(
      [
        ...(assignmentsRes.data ?? []).map((row: any) => row.campaign_id),
        ...(signupsRes.data ?? []).map((row: any) => row.campaign_id),
        ...(routeRows ?? []).map((row: any) => row.campaign_id),
        ...(routeDetails ?? []).map((route: any) => route.campaign_id),
      ].filter(Boolean),
    ),
  );

  const { data: campaignRows, error: campaignRowsError } = campaignIds.length
    ? await admin
        .from("campaign")
        .select("*")
        .in("id", campaignIds)
    : { data: [] as any[], error: null };

  if (campaignRowsError) {
    throw campaignRowsError;
  }

  const campaignMap = new Map((campaignRows ?? []).map((campaign: any) => [campaign.id, campaign]));
  const routeById = new Map((routeDetails ?? []).map((route: any) => [route.id, route]));

  const formatCoordinate = (lat?: number | null, lng?: number | null) => {
    if (typeof lat !== "number" || typeof lng !== "number") return undefined;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const routes: RiderRoute[] = routeRows.map((row: any) => {
    const route = routeById.get(row.route_id);
    const tracking = trackingByRoute.get(route?.id ?? row.route_id) ?? [];
    const progress = Number(row.progress ?? calculateRouteProgress(row.status));
    const lastSyncedAt = resolveLatestTimestamp([
      row.updated_at,
      row.completed_at,
      row.started_at,
      row.assigned_at,
      ...tracking.flatMap((item: any) => [item.end_time, item.start_time]),
    ]);

    const timelineCandidates: RiderTimelineEvent[] = [
      {
        id: `${row.id}-assigned`,
        label: "Assigned",
        detail: "Route assignment synced from MOVRR dispatch.",
        occurredAt: row.assigned_at ?? null,
        tone: "info",
      },
      {
        id: `${row.id}-started`,
        label: "Started",
        detail: "Route execution start captured by mobile telemetry.",
        occurredAt: row.started_at ?? null,
        tone: "default",
      },
      {
        id: `${row.id}-completed`,
        label: "Completed",
        detail: "Route completion synced from MOVRR Mobile.",
        occurredAt: row.completed_at ?? null,
        tone: "success",
      },
    ];

    return {
      id: route?.id ?? row.id,
      riderRouteId: row.id,
      name: route?.name ?? "Assigned route",
      status: row.status ?? "assigned",
      city: route?.city ?? resolvedProfile?.city ?? undefined,
      startLocation: formatCoordinate(route?.start_lat, route?.start_lng),
      endLocation: formatCoordinate(route?.end_lat, route?.end_lng),
      startedAt: row.started_at,
      completedAt: row.completed_at,
      routeProgress: progress,
      coverageKm: Number(route?.coverage_km ?? 0),
      campaignId: route?.campaign_id ?? null,
      lastSyncedAt,
      complianceStatus: getComplianceStatus(progress),
      syncSource: "movrr-mobile",
      timeline: timelineCandidates.filter((event) => Boolean(event.occurredAt)),
    };
  });

  const balanceRows = balanceRes.data ?? [];
  const totalPointsBalance = balanceRows.reduce((sum: number, row: any) => sum + Number(row.points_balance ?? 0), 0);
  const totalLifetimePointsEarned = balanceRows.reduce((sum: number, row: any) => sum + Number(row.lifetime_points_earned ?? 0), 0);

  const rewards: RiderRewardTransaction[] = (rewardsRes.data ?? []).map((row: any) => ({
    id: row.id,
    type: row.source === "adjustment" ? "adjusted" : row.source === "redemption" ? "redeemed" : "awarded",
    category: mapRewardCategory(row.source),
    points: Number(row.points_earned ?? 0),
    description:
      row.metadata?.description ??
      (row.source === "redemption"
        ? "Reward redeemed"
        : row.source === "adjustment"
          ? "Points adjusted"
          : "Points awarded"),
    createdAt: row.created_at,
  }));

  const notifications = (notificationsRes.data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    category: mapNotificationCategory(row.type),
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  }));

  const campaigns = campaignIds
    .map((campaignId) => campaignMap.get(campaignId))
    .filter(Boolean)
    .map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description ?? undefined,
    status: campaign.lifecycle_status ?? "draft",
    campaignType: campaign.campaign_type ?? undefined,
    startDate: campaign.start_date ?? undefined,
    endDate: campaign.end_date ?? undefined,
    targetZones: campaign.target_zones ?? [],
    qrScans: Number(campaign.qr_scans ?? 0),
    impressions: Number(campaign.impressions ?? 0),
  }));

  const activeCampaigns = campaigns.length;
  const activeRoutes = routes.length;
  const awardedPoints = rewards
    .filter((reward) => reward.points > 0 && reward.category !== "adjustment" && reward.category !== "redemption")
    .reduce((sum, reward) => sum + reward.points, 0);
  const redeemedPoints = rewards
    .filter((reward) => reward.category === "redemption")
    .reduce((sum, reward) => sum + Math.abs(reward.points), 0);
  const adjustmentPoints = rewards
    .filter((reward) => reward.category === "adjustment")
    .reduce((sum, reward) => sum + reward.points, 0);
  const currentCompliance = routes.length
    ? Math.round(routes.reduce((sum, route) => sum + route.routeProgress, 0) / routes.length)
    : 0;

  return {
    riderId,
    pointsBalance: totalPointsBalance,
    lifetimePointsEarned: totalLifetimePointsEarned,
    activeCampaigns,
    activeRoutes,
    currentCompliance,
    complianceStatus: getComplianceStatus(currentCompliance),
    lastActive: session.authUser.last_sign_in_at ?? null,
    lastMobileSyncAt: resolveLatestTimestamp(routes.map((route) => route.lastSyncedAt)),
    campaigns,
    routes,
    rewards,
    rewardsSummary: {
      availablePoints: totalPointsBalance,
      lifetimePointsEarned: totalLifetimePointsEarned,
      awardedPoints,
      redeemedPoints,
      adjustmentPoints,
    },
    notifications,
    preferences: {
      productNotifications: userPreferences?.notifications ?? true,
    },
    profile: {
      riderId,
      email: session.appUser.email,
      city: resolvedProfile?.city ?? null,
      country: resolvedProfile?.country ?? null,
      isCertified: Boolean(resolvedProfile?.is_certified),
      accountNotes: null,
      vehicleType: resolvedProfile?.vehicle_type ?? null,
      emergencyContact: resolvedProfile?.emergency_contact ?? null,
      emergencyPhone: resolvedProfile?.emergency_phone ?? null,
      languagePreference: session.appUser.languagePreference,
      timezone: "Europe/Amsterdam",
    },
    support: {
      supportEmail: SUPPORT_EMAIL,
      helpLabel: "Contact MOVRR support for route execution issues or account assistance.",
    },
  };
}

export async function getRiderRouteDetail(routeId: string) {
  const session = await requireProductSession(["rider"]);
  const admin = createSupabaseAdminClient();
  const riderRows = await getRiderProfileRows(admin, session.appUser.id);
  const riderIds = Array.from(new Set(riderRows.map((row) => row.id)));
  if (!riderIds.length) return null;

  const { data: assignmentRows } = await admin
    .from("rider_route")
    .select("id, rider_id, route_id, campaign_id, status, assigned_at, started_at, completed_at, updated_at, progress")
    .in("rider_id", riderIds)
    .eq("route_id", routeId)
    .order("updated_at", { ascending: false })
    .limit(1);

  const assignment = assignmentRows?.[0] ?? null;

  if (!assignment) return null;

  const { data: route } = await admin
    .from("route")
    .select(
      "id, name, city, description, start_lat, start_lng, end_lat, end_lng, campaign_id, estimated_duration_minutes, coverage_km",
    )
    .eq("id", routeId)
    .maybeSingle();
  const { data: tracking } = await admin
    .from("route_tracking")
    .select("id, start_time, end_time, total_distance, route_compliance, impressions_earned")
    .eq("route_id", routeId)
    .in("rider_id", riderIds)
    .order("start_time", { ascending: false })
    .limit(10);

  const trackingIds = (tracking ?? []).map((row: any) => row.id);
  const { data: impressions } = trackingIds.length
    ? await admin.from("impression_events").select("id").in("route_tracking_id", trackingIds)
    : { data: [] };
  const { data: campaignZones } = route?.campaign_id
    ? await admin.from("campaign_zone").select("id, name").eq("campaign_id", route.campaign_id)
    : { data: [] };
  const { data: hotZones } = route?.campaign_id
    ? await admin
        .from("campaign_hot_zone")
        .select("id, name, bonus_percent")
        .eq("campaign_id", route.campaign_id)
    : { data: [] };

  const progress = Number(assignment.progress ?? calculateRouteProgress(assignment.status));
  const lastSyncedAt = resolveLatestTimestamp([
    assignment.updated_at,
    assignment.completed_at,
    assignment.started_at,
    assignment.assigned_at,
    ...(tracking ?? []).flatMap((row: any) => [row.end_time, row.start_time]),
  ]);

  const timelineCandidates: RiderTimelineEvent[] = [
    {
      id: `${assignment.id}-assigned`,
      label: "Assigned",
      detail: "Route assignment synced from MOVRR dispatch.",
      occurredAt: assignment.assigned_at ?? null,
      tone: "info",
    },
    {
      id: `${assignment.id}-started`,
      label: "Started",
      detail: "Route execution start captured by mobile telemetry.",
      occurredAt: assignment.started_at ?? null,
      tone: "default",
    },
    {
      id: `${assignment.id}-completed`,
      label: "Completed",
      detail: "Route completion synced from MOVRR Mobile.",
      occurredAt: assignment.completed_at ?? null,
      tone: "success",
    },
    ...((tracking ?? []).map((row: any) => ({
      id: row.id,
      label: "Tracking sync",
      detail: `Telemetry distance ${Number(row.total_distance ?? 0).toFixed(1)} km - Compliance ${Number(row.route_compliance ?? 0)}%`,
      occurredAt: row.end_time ?? row.start_time ?? null,
      tone: "default" as const,
    }))),
  ];

  return {
    id: route?.id ?? routeId,
    riderRouteId: assignment.id,
    name: route?.name ?? "Route",
    description: route?.description ?? null,
    city: route?.city ?? null,
    startLocation: route ? `${Number(route.start_lat).toFixed(5)}, ${Number(route.start_lng).toFixed(5)}` : null,
    endLocation: route ? `${Number(route.end_lat).toFixed(5)}, ${Number(route.end_lng).toFixed(5)}` : null,
    status: assignment.status ?? "assigned",
    startedAt: assignment.started_at,
    completedAt: assignment.completed_at,
    routeProgress: progress,
    coverageKm: Number(route?.coverage_km ?? 0),
    campaignId: route?.campaign_id ?? null,
    lastSyncedAt,
    complianceStatus: getComplianceStatus(progress),
    syncSource: "movrr-mobile",
    timeline: timelineCandidates.filter((event) => Boolean(event.occurredAt)),
    estimatedDurationMinutes: Number(route?.estimated_duration_minutes ?? 0),
    verifiedMinutes: 0,
    distanceKm: (tracking ?? []).reduce(
      (sum: number, row: any) => sum + Number(row.total_distance ?? 0),
      0,
    ),
    impressions: (tracking ?? []).reduce((sum: number, row: any) => sum + Number(row.impressions_earned ?? 0), 0) || (impressions ?? []).length,
    campaignZones: campaignZones ?? [],
    hotZones: hotZones ?? [],
    tracking: tracking ?? [],
  };
}

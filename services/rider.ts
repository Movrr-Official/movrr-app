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

export async function getRiderDashboardData(): Promise<RiderDashboard> {
  const session = await requireProductSession(["rider"]);
  const admin = createSupabaseAdminClient();
  const riderId = session.riderProfile?.id;
  const { data: userPreferences } = await admin
    .from("user_preferences")
    .select("notifications")
    .eq("user_id", session.appUser.id)
    .maybeSingle();

  if (!riderId) {
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
        .select(
          "campaign_id, campaign:campaign_id (id, name, description, lifecycle_status, campaign_type, start_date, end_date, target_zones, impressions, qr_scans, conversions)",
        )
        .eq("rider_id", riderId),
      admin
        .from("campaign_signup")
        .select(
          "campaign_id, campaign:campaign_id (id, name, description, lifecycle_status, campaign_type, start_date, end_date, target_zones, impressions, qr_scans, conversions)",
        )
        .eq("rider_id", riderId),
      admin
        .from("rider_route")
        .select(
          "id, route_id, status, assigned_at, started_at, completed_at, updated_at, route_progress, route:route_id (id, name, city, start_location, end_location, estimated_duration_minutes, coverage_km, campaign_id)",
        )
        .eq("rider_id", riderId)
        .order("assigned_at", { ascending: false }),
      admin
        .from("rider_reward_balance")
        .select("points_balance, lifetime_points_earned")
        .eq("rider_id", riderId)
        .maybeSingle(),
      admin
        .from("reward_transactions")
        .select("id, points_earned, source, metadata, created_at")
        .eq("rider_id", riderId)
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
        .select("id, route_id, verified_minutes, distance_km, started_at, ended_at")
        .eq("rider_id", riderId)
        .in("route_id", routeIds)
        .order("started_at", { ascending: false })
    : { data: [] };

  const trackingByRoute = new Map<string, any[]>();
  (trackingRows ?? []).forEach((row: any) => {
    const key = row.route_id;
    if (!trackingByRoute.has(key)) trackingByRoute.set(key, []);
    trackingByRoute.get(key)?.push(row);
  });

  const campaignMap = new Map<string, any>();
  [...(assignmentsRes.data ?? []), ...(signupsRes.data ?? [])].forEach((row) => {
    const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
    if (campaign?.id) campaignMap.set(campaign.id, campaign);
  });

  const routes: RiderRoute[] = routeRows.map((row: any) => {
    const route = Array.isArray(row.route) ? row.route[0] : row.route;
    const tracking = trackingByRoute.get(route?.id ?? row.route_id) ?? [];
    const progress = Number(row.route_progress ?? calculateRouteProgress(row.status));
    const lastSyncedAt = resolveLatestTimestamp([
      row.updated_at,
      row.completed_at,
      row.started_at,
      row.assigned_at,
      ...tracking.flatMap((item: any) => [item.ended_at, item.started_at]),
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
      city: route?.city ?? session.riderProfile?.city ?? undefined,
      startLocation: route?.start_location ?? undefined,
      endLocation: route?.end_location ?? undefined,
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

  const campaigns = [...campaignMap.values()].map((campaign: any) => ({
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

  const activeCampaigns = campaigns.filter((campaign) => ["active", "paused"].includes(campaign.status)).length;
  const activeRoutes = routes.filter((route) => ["assigned", "in-progress"].includes(route.status)).length;
  const awardedPoints = rewards
    .filter((reward) => reward.points > 0 && reward.category !== "adjustment")
    .reduce((sum, reward) => sum + reward.points, 0);
  const redeemedPoints = Math.abs(
    rewards
      .filter((reward) => reward.points < 0 || reward.category === "redemption")
      .reduce((sum, reward) => sum + reward.points, 0),
  );
  const adjustmentPoints = rewards
    .filter((reward) => reward.category === "adjustment")
    .reduce((sum, reward) => sum + reward.points, 0);
  const currentCompliance = routes.length
    ? Math.round(routes.reduce((sum, route) => sum + route.routeProgress, 0) / routes.length)
    : 0;

  return {
    riderId,
    pointsBalance: Number(balanceRes.data?.points_balance ?? 0),
    lifetimePointsEarned: Number(balanceRes.data?.lifetime_points_earned ?? 0),
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
      availablePoints: Number(balanceRes.data?.points_balance ?? 0),
      lifetimePointsEarned: Number(balanceRes.data?.lifetime_points_earned ?? 0),
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
      city: session.riderProfile?.city ?? null,
      country: session.riderProfile?.country ?? null,
      isCertified: Boolean(session.riderProfile?.is_certified),
      accountNotes: null,
      vehicleType: session.riderProfile?.vehicle_type ?? null,
      emergencyContact: session.riderProfile?.emergency_contact ?? null,
      emergencyPhone: session.riderProfile?.emergency_phone ?? null,
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
  const riderId = session.riderProfile?.id;
  if (!riderId) return null;

  const { data: assignment } = await admin
    .from("rider_route")
    .select(
      "id, status, assigned_at, started_at, completed_at, updated_at, route_progress, route:route_id (id, name, city, description, start_location, end_location, campaign_id, estimated_duration_minutes, coverage_km)",
    )
    .eq("rider_id", riderId)
    .eq("route_id", routeId)
    .maybeSingle();

  if (!assignment) return null;

  const route = Array.isArray(assignment.route) ? assignment.route[0] : assignment.route;
  const { data: tracking } = await admin
    .from("route_tracking")
    .select("id, verified_minutes, distance_km, started_at, ended_at")
    .eq("route_id", routeId)
    .eq("rider_id", riderId)
    .order("started_at", { ascending: false })
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

  const progress = Number(assignment.route_progress ?? calculateRouteProgress(assignment.status));
  const lastSyncedAt = resolveLatestTimestamp([
    assignment.updated_at,
    assignment.completed_at,
    assignment.started_at,
    assignment.assigned_at,
    ...(tracking ?? []).flatMap((row: any) => [row.ended_at, row.started_at]),
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
      detail: `Verified minutes ${Number(row.verified_minutes ?? 0)} - Distance ${Number(row.distance_km ?? 0).toFixed(1)} km`,
      occurredAt: row.ended_at ?? row.started_at ?? null,
      tone: "default" as const,
    }))),
  ];

  return {
    id: route?.id ?? routeId,
    riderRouteId: assignment.id,
    name: route?.name ?? "Route",
    description: route?.description ?? null,
    city: route?.city ?? null,
    startLocation: route?.start_location ?? null,
    endLocation: route?.end_location ?? null,
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
    verifiedMinutes: (tracking ?? []).reduce(
      (sum: number, row: any) => sum + Number(row.verified_minutes ?? 0),
      0,
    ),
    distanceKm: (tracking ?? []).reduce(
      (sum: number, row: any) => sum + Number(row.distance_km ?? 0),
      0,
    ),
    impressions: (impressions ?? []).length,
    campaignZones: campaignZones ?? [],
    hotZones: hotZones ?? [],
    tracking: tracking ?? [],
  };
}

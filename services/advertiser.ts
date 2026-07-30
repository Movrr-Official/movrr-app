import { SUPPORT_EMAIL } from "@/lib/env";
import { getBillingFallback } from "@/lib/billing";
import { requireProductSession } from "@/lib/appUser";
import { resolveLatestTimestamp } from "@/lib/product-freshness";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getAdvertiserCampaign,
  listAdvertiserCampaigns,
} from "@/lib/platform/advertiserCampaignPlatform";
import type { AdvertiserAnalyticsRange, AdvertiserBilling, AdvertiserDashboard, AdvertiserTimelineEvent } from "@/schemas";

function normalizeCampaignType(value?: string | null) {
  return value === "swarm" ? "swarm" : "destination_ride";
}

function getRangeStart(range: AdvertiserAnalyticsRange) {
  const now = new Date();
  const next = new Date(now);
  if (range === "30d") next.setDate(now.getDate() - 30);
  if (range === "90d") next.setDate(now.getDate() - 90);
  if (range === "12m") next.setMonth(now.getMonth() - 12);
  return next;
}

function bucketLabel(date: Date, range: AdvertiserAnalyticsRange) {
  return range === "12m"
    ? date.toLocaleDateString("en-GB", { month: "short" })
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function mapNotificationCategory(type?: string | null) {
  if (!type) return "general";
  if (type.includes("campaign")) return "campaign";
  if (type.includes("billing")) return "billing";
  return "account";
}

function cloneBillingFallback(email: string): AdvertiserBilling {
  const fallback = getBillingFallback(email);
  return {
    connected: fallback.connected,
    connectionState: fallback.connectionState,
    planName: fallback.planName,
    planStatus: fallback.planStatus,
    invoiceContact: fallback.invoiceContact,
    usageSummary: fallback.usageSummary.map((item) => ({ label: item.label, value: item.value })),
    entitlements: [...fallback.entitlements],
    financeHandoffEmail: fallback.financeHandoffEmail,
    portalUrl: fallback.portalUrl,
  };
}

export async function getAdvertiserDashboardData(range: AdvertiserAnalyticsRange = "90d"): Promise<AdvertiserDashboard> {
  const session = await requireProductSession(["advertiser"]);
  const admin = createSupabaseAdminClient();
  const advertiserId = session.advertiserProfile?.id;
  const { data: userPreferences } = await admin.from("user_preferences").select("notifications").eq("user_id", session.appUser.id).maybeSingle();

  if (!advertiserId) {
    return {
      advertiserId: "",
      campaigns: [],
      analytics: {
        range,
        totalBudget: 0,
        totalImpressions: 0,
        totalQrScans: 0,
        activeCampaigns: 0,
        lastUpdatedAt: null,
        campaignPerformance: [],
        trendSeries: [],
        zonePerformance: [],
      },
      notifications: [],
      billing: cloneBillingFallback(session.appUser.email),
      settings: {
        advertiserId: "",
        companyName: session.appUser.organization ?? session.appUser.name,
        contactName: session.appUser.name,
        companyEmail: session.appUser.email,
        phone: session.appUser.phone,
        website: null,
        industry: null,
        language: session.appUser.languagePreference,
        timezone: "UTC",
        emailNotifications: true,
        campaignUpdates: true,
        productNotifications: userPreferences?.notifications ?? true,
      },
      support: {
        supportEmail: SUPPORT_EMAIL,
        helpLabel: "Contact MOVRR support for campaign visibility or billing assistance.",
      },
    };
  }

  let campaignsSource: Array<Record<string, unknown>> = [];
  try {
    const platformCampaigns = await listAdvertiserCampaigns();
    campaignsSource = platformCampaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description ?? "",
      lifecycle_status: campaign.lifecycleStatus,
      budget: campaign.budget ?? 0,
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      campaign_type: campaign.campaignType,
      target_zones: campaign.targetZones,
      impressions: campaign.impressions ?? 0,
      qr_scans: campaign.qrScans ?? 0,
      max_riders: campaign.maxRiders ?? 0,
      created_at: null,
      updated_at: null,
    }));
  } catch {
    const { data } = await admin
      .from("campaign")
      .select("id, name, description, lifecycle_status, budget, start_date, end_date, campaign_type, target_zones, impressions, qr_scans, max_riders, created_at, updated_at")
      .eq("advertiser_id", advertiserId)
      .order("created_at", { ascending: false });
    campaignsSource = (data ?? []) as Array<Record<string, unknown>>;
  }

  const campaignIds = campaignsSource.map((campaign) => String(campaign.id));
  const [assignmentsRes, zonesRes, hotZonesRes, notificationsRes] = await Promise.all([
    campaignIds.length ? admin.from("campaign_assignment").select("campaign_id, rider_id").in("campaign_id", campaignIds) : Promise.resolve({ data: [] as any[] }),
    campaignIds.length ? admin.from("campaign_zone").select("campaign_id, name").in("campaign_id", campaignIds) : Promise.resolve({ data: [] as any[] }),
    campaignIds.length ? admin.from("campaign_hot_zone").select("campaign_id, name").in("campaign_id", campaignIds) : Promise.resolve({ data: [] as any[] }),
    admin.from("notifications").select("id, title, message, type, is_read, created_at").eq("user_id", session.appUser.id).order("created_at", { ascending: false }).limit(25),
  ]);

  const assignedCounts = new Map<string, number>();
  (assignmentsRes.data ?? []).forEach((row: any) => {
    assignedCounts.set(row.campaign_id, (assignedCounts.get(row.campaign_id) ?? 0) + 1);
  });

  const zoneCounts = new Map<string, number>();
  [...(zonesRes.data ?? []), ...(hotZonesRes.data ?? [])].forEach((row: any) => {
    if (!row?.name) return;
    zoneCounts.set(row.name, (zoneCounts.get(row.name) ?? 0) + 1);
  });

  const mappedCampaigns = campaignsSource.map((campaign) => ({
    id: String(campaign.id),
    name: String(campaign.name ?? "Campaign"),
    description: typeof campaign.description === "string" ? campaign.description : undefined,
    lifecycleStatus: String(campaign.lifecycle_status ?? "draft"),
    budget: Number(campaign.budget ?? 0),
    startDate: String(campaign.start_date ?? ""),
    endDate: String(campaign.end_date ?? ""),
    campaignType: normalizeCampaignType(
      typeof campaign.campaign_type === "string" ? campaign.campaign_type : null,
    ),
    targetZones: Array.isArray(campaign.target_zones)
      ? campaign.target_zones.filter((zone): zone is string => typeof zone === "string")
      : [],
    impressions: Number(campaign.impressions ?? 0),
    qrScans: Number(campaign.qr_scans ?? 0),
    maxRiders: Number(campaign.max_riders ?? 0),
    ridersAssigned: assignedCounts.get(String(campaign.id)) ?? 0,
    createdAt:
      typeof campaign.created_at === "string" ? campaign.created_at : undefined,
    updatedAt:
      typeof campaign.updated_at === "string" ? campaign.updated_at : undefined,
  }));

  const rangeStart = getRangeStart(range);
  const campaignsForAnalytics = mappedCampaigns.filter((campaign: any) => {
    const date = new Date(campaign.startDate ?? campaign.createdAt ?? campaign.endDate ?? Date.now());
    return !Number.isNaN(date.getTime()) && date >= rangeStart;
  });
  const analyticsSource = campaignsForAnalytics.length ? campaignsForAnalytics : mappedCampaigns;

  const trendMap = new Map<string, { label: string; impressions: number; qrScans: number }>();
  analyticsSource.forEach((campaign: any) => {
    const date = new Date(campaign.startDate ?? campaign.createdAt ?? campaign.endDate ?? Date.now());
    const label = bucketLabel(date, range);
    if (!trendMap.has(label)) trendMap.set(label, { label, impressions: 0, qrScans: 0 });
    const bucket = trendMap.get(label)!;
    bucket.impressions += campaign.impressions;
    bucket.qrScans += campaign.qrScans;
  });

  const analytics = {
    range,
    totalBudget: analyticsSource.reduce((sum: number, campaign: any) => sum + campaign.budget, 0),
    totalImpressions: analyticsSource.reduce((sum: number, campaign: any) => sum + campaign.impressions, 0),
    totalQrScans: analyticsSource.reduce((sum: number, campaign: any) => sum + campaign.qrScans, 0),
    activeCampaigns: analyticsSource.filter((campaign: any) => campaign.lifecycleStatus === "active").length,
    lastUpdatedAt: resolveLatestTimestamp(analyticsSource.flatMap((campaign: any) => [campaign.updatedAt, campaign.createdAt, campaign.endDate])),
    campaignPerformance: analyticsSource.slice(0, 8).map((campaign: any) => ({
      label: campaign.name,
      impressions: campaign.impressions,
      scans: campaign.qrScans,
    })),
    trendSeries: [...trendMap.values()],
    zonePerformance: [...zoneCounts.entries()].slice(0, 8).map(([label, campaignCount]) => ({ label, campaignCount })),
  };

  const billing = cloneBillingFallback(session.advertiserProfile?.company_email ?? session.appUser.email);
  billing.usageSummary = [
    { label: "Active campaigns", value: String(analytics.activeCampaigns) },
    { label: "Budget exposure", value: String(analytics.totalBudget) },
    { label: "Impressions", value: String(analytics.totalImpressions) },
  ];
  billing.entitlements = ["Campaign visibility", "Campaign analytics", "Rider participation visibility", "Billing portal handoff"];
  billing.financeHandoffEmail = SUPPORT_EMAIL;

  return {
    advertiserId,
    campaigns: mappedCampaigns,
    analytics,
    notifications: (notificationsRes.data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      category: mapNotificationCategory(row.type),
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    })),
    billing,
    settings: {
      advertiserId,
      companyName: session.advertiserProfile?.company_name ?? session.appUser.organization ?? session.appUser.name,
      contactName: session.appUser.name,
      companyEmail: session.advertiserProfile?.company_email ?? session.appUser.email,
      phone: session.appUser.phone,
      website: session.advertiserProfile?.website ?? null,
      industry: session.advertiserProfile?.industry ?? null,
      language: session.advertiserProfile?.language ?? session.appUser.languagePreference,
      timezone: session.advertiserProfile?.timezone ?? "UTC",
      emailNotifications: session.advertiserProfile?.email_notifications ?? true,
      campaignUpdates: session.advertiserProfile?.campaign_updates ?? true,
      productNotifications: userPreferences?.notifications ?? true,
    },
    support: {
      supportEmail: SUPPORT_EMAIL,
      helpLabel: "Contact MOVRR support for campaign visibility or billing assistance.",
    },
  };
}

export async function getAdvertiserCampaignDetail(campaignId: string) {
  const session = await requireProductSession(["advertiser"]);
  const admin = createSupabaseAdminClient();
  const advertiserId = session.advertiserProfile?.id;
  if (!advertiserId) return null;

  let campaign: Record<string, unknown> | null = null;
  try {
    const platformCampaign = await getAdvertiserCampaign(campaignId);
    if (platformCampaign) {
      campaign = {
        id: platformCampaign.id,
        name: platformCampaign.name,
        description: platformCampaign.description ?? null,
        lifecycle_status: platformCampaign.lifecycleStatus,
        budget: platformCampaign.budget ?? 0,
        start_date: platformCampaign.startDate,
        end_date: platformCampaign.endDate,
        campaign_type: platformCampaign.campaignType,
        target_zones: platformCampaign.targetZones,
        impressions: platformCampaign.impressions ?? 0,
        qr_scans: platformCampaign.qrScans ?? 0,
        max_riders: platformCampaign.maxRiders ?? 0,
        vehicle_type_required: "bike",
        created_at: null,
        updated_at: null,
      };
    }
  } catch {
    campaign = null;
  }

  if (!campaign) {
    const { data } = await admin
      .from("campaign")
      .select("id, name, description, lifecycle_status, budget, start_date, end_date, campaign_type, target_zones, impressions, qr_scans, max_riders, vehicle_type_required, created_at, updated_at")
      .eq("advertiser_id", advertiserId)
      .eq("id", campaignId)
      .maybeSingle();
    campaign = (data as Record<string, unknown> | null) ?? null;
  }

  if (!campaign) return null;

  const [{ data: assignments }, { data: zones }, { data: hotZones }] = await Promise.all([
    admin.from("campaign_assignment").select("rider_id, assigned_at, selected_at, confirmed_at").eq("campaign_id", campaignId),
    admin.from("campaign_zone").select("id, name").eq("campaign_id", campaignId),
    admin.from("campaign_hot_zone").select("id, name, bonus_percent").eq("campaign_id", campaignId),
  ]);

  const riderIds = (assignments ?? []).map((row: any) => row.rider_id).filter(Boolean);
  const { data: riders } = riderIds.length ? await admin.from("rider").select("id, user_id, city, country").in("id", riderIds) : { data: [] };
  const userIds = (riders ?? []).map((row: any) => row.user_id).filter(Boolean);
  const { data: users } = userIds.length ? await admin.from("user").select("id, name, email").in("id", userIds) : { data: [] };

  const userMap = new Map((users ?? []).map((user: any) => [user.id, user]));
  const ridersWithUsers = (riders ?? []).map((rider: any) => ({
    id: rider.id,
    name: userMap.get(rider.user_id)?.name ?? "Rider",
    email: userMap.get(rider.user_id)?.email ?? "",
    city: rider.city,
    country: rider.country,
  }));

  const now = Date.now();
  const start = campaign.start_date ? new Date(String(campaign.start_date)).getTime() : null;
  const end = campaign.end_date ? new Date(String(campaign.end_date)).getTime() : null;
  const pacingHealth = start && end && now > start && now < end ? (Number(campaign.impressions ?? 0) > 0 ? "healthy" : "watch") : "default";

  const timelineCandidates: AdvertiserTimelineEvent[] = [
    { id: `${campaign.id}-created`, label: "Created", detail: "Campaign record created and assigned to your advertiser account.", occurredAt: (campaign.created_at as string | null) ?? null, tone: "default" },
    { id: `${campaign.id}-scheduled`, label: "Scheduled", detail: "Campaign start window configured.", occurredAt: (campaign.start_date as string | null) ?? null, tone: "info" },
    { id: `${campaign.id}-active`, label: "Active delivery", detail: "Campaign is live or ready for rider participation visibility.", occurredAt: campaign.lifecycle_status === "active" ? (campaign.start_date as string | null) ?? null : null, tone: "success" },
    { id: `${campaign.id}-closing`, label: "End window", detail: "Current configured campaign end date.", occurredAt: (campaign.end_date as string | null) ?? null, tone: "warning" },
  ];
  const timeline = timelineCandidates.filter((event) => Boolean(event.occurredAt));

  return {
    id: String(campaign.id),
    name: String(campaign.name ?? "Campaign"),
    description: typeof campaign.description === "string" ? campaign.description : null,
    lifecycleStatus: String(campaign.lifecycle_status ?? "draft"),
    budget: Number(campaign.budget ?? 0),
    startDate: campaign.start_date as string | undefined,
    endDate: campaign.end_date as string | undefined,
    campaignType: normalizeCampaignType(
      typeof campaign.campaign_type === "string" ? campaign.campaign_type : null,
    ),
    targetZones: Array.isArray(campaign.target_zones)
      ? campaign.target_zones.filter((zone): zone is string => typeof zone === "string")
      : [],
    impressions: Number(campaign.impressions ?? 0),
    qrScans: Number(campaign.qr_scans ?? 0),
    maxRiders: Number(campaign.max_riders ?? 0),
    vehicleTypeRequired: String(campaign.vehicle_type_required ?? "bike"),
    riders: ridersWithUsers,
    zones: zones ?? [],
    hotZones: hotZones ?? [],
    metadata: {
      pacingHealth,
      zoneCount: (zones ?? []).length,
      hotZoneCount: (hotZones ?? []).length,
      lastUpdatedAt: resolveLatestTimestamp([
        campaign.updated_at as string | undefined,
        campaign.created_at as string | undefined,
        campaign.end_date as string | undefined,
      ]),
    },
    timeline,
  };
}

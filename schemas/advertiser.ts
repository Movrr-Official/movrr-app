import { z } from "zod";

export const advertiserTimelineEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  occurredAt: z.string().nullable(),
  tone: z.enum(["default", "info", "success", "warning"]),
});

export const advertiserCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  lifecycleStatus: z.string(),
  budget: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  campaignType: z.string(),
  targetZones: z.array(z.string()).default([]),
  impressions: z.number().default(0),
  qrScans: z.number().default(0),
  maxRiders: z.number().default(0),
  ridersAssigned: z.number().default(0),
});

export const advertiserNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  category: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export const advertiserBillingSchema = z.object({
  connected: z.boolean(),
  connectionState: z.enum(["connected", "handoff", "not_connected", "degraded"]),
  planName: z.string(),
  planStatus: z.string(),
  invoiceContact: z.string(),
  usageSummary: z.array(z.object({ label: z.string(), value: z.string() })),
  entitlements: z.array(z.string()),
  financeHandoffEmail: z.string().email(),
  portalUrl: z.string().optional().nullable(),
});

export const advertiserSettingsSchema = z.object({
  advertiserId: z.string(),
  companyName: z.string(),
  contactName: z.string(),
  companyEmail: z.string().email(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  emailNotifications: z.boolean().default(true),
  campaignUpdates: z.boolean().default(true),
  productNotifications: z.boolean().default(true),
});

export const advertiserAnalyticsRangeSchema = z.enum(["30d", "90d", "12m"]);

export const advertiserAnalyticsSchema = z.object({
  range: advertiserAnalyticsRangeSchema.default("90d"),
  totalBudget: z.number(),
  totalImpressions: z.number(),
  totalQrScans: z.number(),
  activeCampaigns: z.number(),
  lastUpdatedAt: z.string().nullable(),
  campaignPerformance: z.array(
    z.object({
      label: z.string(),
      impressions: z.number(),
      scans: z.number(),
    }),
  ),
  trendSeries: z.array(
    z.object({
      label: z.string(),
      impressions: z.number(),
      qrScans: z.number(),
    }),
  ),
  zonePerformance: z.array(
    z.object({
      label: z.string(),
      campaignCount: z.number(),
    }),
  ),
});

export const advertiserDashboardSchema = z.object({
  advertiserId: z.string(),
  campaigns: z.array(advertiserCampaignSchema),
  analytics: advertiserAnalyticsSchema,
  notifications: z.array(advertiserNotificationSchema),
  billing: advertiserBillingSchema,
  settings: advertiserSettingsSchema,
  support: z.object({ supportEmail: z.string().email(), helpLabel: z.string() }),
});

export type AdvertiserTimelineEvent = z.infer<typeof advertiserTimelineEventSchema>;
export type AdvertiserCampaign = z.infer<typeof advertiserCampaignSchema>;
export type AdvertiserNotification = z.infer<typeof advertiserNotificationSchema>;
export type AdvertiserBilling = z.infer<typeof advertiserBillingSchema>;
export type AdvertiserSettings = z.infer<typeof advertiserSettingsSchema>;
export type AdvertiserAnalytics = z.infer<typeof advertiserAnalyticsSchema>;
export type AdvertiserDashboard = z.infer<typeof advertiserDashboardSchema>;
export type AdvertiserAnalyticsRange = z.infer<typeof advertiserAnalyticsRangeSchema>;

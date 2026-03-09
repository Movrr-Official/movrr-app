import { z } from "zod";

export const riderTimelineEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  occurredAt: z.string().nullable(),
  tone: z.enum(["default", "info", "success", "warning"]),
});

export const riderCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.string(),
  campaignType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetZones: z.array(z.string()).default([]),
  qrScans: z.number().default(0),
  impressions: z.number().default(0),
});

export const riderRouteSchema = z.object({
  id: z.string(),
  riderRouteId: z.string().optional(),
  name: z.string(),
  status: z.string(),
  city: z.string().optional(),
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
  startedAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  routeProgress: z.number().default(0),
  coverageKm: z.number().default(0),
  campaignId: z.string().optional().nullable(),
  lastSyncedAt: z.string().nullable().optional(),
  complianceStatus: z.enum(["healthy", "watch", "attention"]).default("watch"),
  syncSource: z.string().default("movrr-mobile"),
  timeline: z.array(riderTimelineEventSchema).default([]),
});

export const riderRewardTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(["awarded", "redeemed", "adjusted"]),
  category: z.enum(["campaign", "route", "adjustment", "redemption", "other"]).default("other"),
  points: z.number(),
  description: z.string(),
  createdAt: z.string(),
});

export const riderRewardsSummarySchema = z.object({
  availablePoints: z.number(),
  lifetimePointsEarned: z.number(),
  awardedPoints: z.number(),
  redeemedPoints: z.number(),
  adjustmentPoints: z.number(),
});

export const riderNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  category: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export const riderNotificationPreferencesSchema = z.object({
  productNotifications: z.boolean().default(true),
});

export const riderProfileSchema = z.object({
  riderId: z.string(),
  email: z.string().email(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  isCertified: z.boolean().default(false),
  accountNotes: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  languagePreference: z.string().default("en"),
  timezone: z.string().default("Europe/Amsterdam"),
});

export const riderSupportInfoSchema = z.object({
  supportEmail: z.string().email(),
  helpLabel: z.string(),
});

export const riderDashboardSchema = z.object({
  riderId: z.string(),
  pointsBalance: z.number(),
  lifetimePointsEarned: z.number(),
  activeCampaigns: z.number(),
  activeRoutes: z.number(),
  currentCompliance: z.number(),
  complianceStatus: z.enum(["healthy", "watch", "attention"]).default("watch"),
  lastActive: z.string().optional().nullable(),
  lastMobileSyncAt: z.string().optional().nullable(),
  campaigns: z.array(riderCampaignSchema),
  routes: z.array(riderRouteSchema),
  rewards: z.array(riderRewardTransactionSchema),
  rewardsSummary: riderRewardsSummarySchema,
  notifications: z.array(riderNotificationSchema),
  preferences: riderNotificationPreferencesSchema,
  profile: riderProfileSchema,
  support: riderSupportInfoSchema,
});

export type RiderTimelineEvent = z.infer<typeof riderTimelineEventSchema>;
export type RiderCampaign = z.infer<typeof riderCampaignSchema>;
export type RiderRoute = z.infer<typeof riderRouteSchema>;
export type RiderRewardTransaction = z.infer<typeof riderRewardTransactionSchema>;
export type RiderRewardsSummary = z.infer<typeof riderRewardsSummarySchema>;
export type RiderNotification = z.infer<typeof riderNotificationSchema>;
export type RiderNotificationPreferences = z.infer<typeof riderNotificationPreferencesSchema>;
export type RiderProfile = z.infer<typeof riderProfileSchema>;
export type RiderSupportInfo = z.infer<typeof riderSupportInfoSchema>;
export type RiderDashboard = z.infer<typeof riderDashboardSchema>;

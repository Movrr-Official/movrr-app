import { z } from "zod";

export const partnerMembershipRoleSchema = z.enum([
  "owner",
  "manager",
  "staff",
  "viewer",
]);

export const partnerCapabilitySchema = z.enum([
  "fulfilment.read",
  "fulfilment.validate",
  "fulfilment.confirm",
  "resources.manage",
  "rewards.catalog.read",
  "rewards.manage",
  "staff.manage",
  "analytics.view",
]);

/**
 * Session partnerContext from Platform GET /api/v1/partners/me.
 * Organisation membership is discovered via Platform — not duplicated in movrr-app tables.
 */
export const partnerContextSchema = z.object({
  organisationId: z.string(),
  membershipRole: partnerMembershipRoleSchema.nullable(),
  orgType: z.literal("reward_partner"),
  /** Presentation-only capability list derived from membership role. */
  capabilities: z.array(partnerCapabilitySchema),
});

export const partnerDashboardSchema = z.object({
  organisationId: z.string(),
  membershipRole: partnerMembershipRoleSchema.nullable(),
  pendingCount: z.number().int().nonnegative(),
  failureRateLabel: z.string(),
  analyticsSeriesCount: z.number().int().nonnegative(),
});

export const partnerPendingFulfilmentSchema = z.object({
  id: z.string(),
  state: z.string().optional(),
  progress: z.string().optional(),
  fulfilmentType: z.string().optional(),
  catalogItemId: z.string().optional().nullable(),
  riderId: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export const partnerResourceSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  poolCount: z.number().optional().nullable(),
  availableCount: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
});

export const partnerRewardSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  fulfilmentType: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  pointsCost: z.number().optional().nullable(),
});

export const partnerStaffMemberSchema = z.object({
  id: z.string(),
  organisationId: z.string().optional(),
  userId: z.string(),
  role: partnerMembershipRoleSchema.or(z.string()),
  status: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
});

export const partnerAnalyticsSchema = z.object({
  series: z.array(
    z.object({
      label: z.string().optional(),
      value: z.number().optional(),
      key: z.string().optional(),
    }).passthrough(),
  ),
});

export const partnerSettingsSchema = z.record(z.string(), z.unknown());

export type PartnerContext = z.infer<typeof partnerContextSchema>;
export type PartnerDashboard = z.infer<typeof partnerDashboardSchema>;
export type PartnerPendingFulfilment = z.infer<
  typeof partnerPendingFulfilmentSchema
>;
export type PartnerResource = z.infer<typeof partnerResourceSchema>;
export type PartnerReward = z.infer<typeof partnerRewardSchema>;
export type PartnerStaffMember = z.infer<typeof partnerStaffMemberSchema>;
export type PartnerAnalytics = z.infer<typeof partnerAnalyticsSchema>;
export type PartnerSettings = z.infer<typeof partnerSettingsSchema>;

import { z } from "zod";
import { partnerMembershipRoleSchema } from "./partner";

export const governmentCapabilitySchema = z.enum([
  "programmes.read",
  "compliance.read",
  "impact.read",
  "org.settings",
  "analytics.view",
]);

export const governmentContextSchema = z.object({
  organisationId: z.string(),
  membershipRole: partnerMembershipRoleSchema.nullable(),
  orgType: z.literal("government"),
  name: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  capabilities: z.array(governmentCapabilitySchema),
});

export const governmentProgrammeKpisSchema = z.object({
  activeCampaigns: z.number(),
  totalImpressions: z.number(),
  verifiedRides: z.number(),
  pendingVerification: z.number(),
});

export const governmentProgrammesResponseSchema = z.object({
  kpis: governmentProgrammeKpisSchema,
  campaigns: z.array(z.record(z.string(), z.unknown())),
  complianceSummary: z.object({
    verifiedRides: z.number(),
    pendingReview: z.number(),
    rejectedRides: z.number(),
  }),
});

export type GovernmentContext = z.infer<typeof governmentContextSchema>;
export type GovernmentProgrammeKpis = z.infer<typeof governmentProgrammeKpisSchema>;
export type GovernmentProgrammesResponse = z.infer<
  typeof governmentProgrammesResponseSchema
>;

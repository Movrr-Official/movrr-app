/**
 * Read-only mirror of movrr-admin capability registry types.
 * Canonical source: movrr-admin/features/platform/capabilityRegistry.ts
 */

export type ConsumerCoverage = "full" | "partial" | "none" | "n/a";

export type PlatformActor =
  | "rider"
  | "advertiser"
  | "partner"
  | "government"
  | "administrator"
  | "moderator"
  | "support"
  | "compliance_officer";

export type CapabilityRegistryEntry = {
  id: string;
  name: string;
  backendModule: string;
  apiRoutes: string[];
  adminConsumer: ConsumerCoverage;
  webConsumer: ConsumerCoverage;
  mobileConsumer: ConsumerCoverage;
  primaryActor: PlatformActor;
  secondaryActors: PlatformActor[];
  lifecycleOwner: PlatformActor | "platform";
  permissions: string[];
  analyticsHook?: string;
  notificationsHook?: string;
};

/** Re-export vocabulary aligned with movrr-admin/features/platform/vocabulary.ts */
export const BILLING_CONNECTION_STATES = [
  "not_connected",
  "handoff",
  "connected",
  "degraded",
] as const;

export type BillingConnectionState = (typeof BILLING_CONNECTION_STATES)[number];

export const CAMPAIGN_LIFECYCLE_STATUSES = [
  "draft",
  "open_for_signup",
  "selection_in_progress",
  "confirmed",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type CampaignLifecycleStatus = (typeof CAMPAIGN_LIFECYCLE_STATUSES)[number];

export const CAMPAIGN_LIFECYCLE_LABELS: Record<CampaignLifecycleStatus, string> = {
  draft: "Draft",
  open_for_signup: "Open for signup",
  selection_in_progress: "Selection in progress",
  confirmed: "Confirmed",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BILLING_CONNECTION_LABELS: Record<BillingConnectionState, string> = {
  not_connected: "Not connected",
  handoff: "Portal handoff",
  connected: "Connected",
  degraded: "Degraded",
};

export function campaignLifecycleLabel(status: CampaignLifecycleStatus): string {
  return CAMPAIGN_LIFECYCLE_LABELS[status] ?? status;
}

export function billingConnectionLabel(state: BillingConnectionState): string {
  return BILLING_CONNECTION_LABELS[state] ?? state;
}

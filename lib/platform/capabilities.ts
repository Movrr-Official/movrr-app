import type {
  PartnerCapability,
  PartnerMembershipRole,
  GovernmentCapability,
} from "@/lib/platform/types";

/**
 * Presentation-only capability bundles mirrored from Platform CapabilityCatalog.
 * Used to hide UI the API would deny — never as an authorisation source of truth.
 */
const BUNDLE_CAPABILITIES: Record<
  PartnerMembershipRole,
  readonly PartnerCapability[]
> = {
  owner: [
    "staff.manage",
    "resources.manage",
    "rewards.manage",
    "rewards.catalog.read",
    "fulfilment.validate",
    "fulfilment.confirm",
    "fulfilment.cancel", "fulfilment.refund",
    "fulfilment.read",
    "analytics.view",
  ],
  manager: [
    "resources.manage",
    "rewards.manage",
    "rewards.catalog.read",
    "fulfilment.validate",
    "fulfilment.confirm",
    "fulfilment.cancel", "fulfilment.refund",
    "fulfilment.read",
    "analytics.view",
  ],
  partner_operations_manager: [
    "staff.manage", "resources.manage", "rewards.manage", "rewards.catalog.read",
    "fulfilment.validate", "fulfilment.confirm",
    "fulfilment.cancel", "fulfilment.refund", "fulfilment.read", "analytics.view",
  ],
  staff: [
    "fulfilment.validate",
    "fulfilment.confirm",
    "fulfilment.read",
    "analytics.view",
    "rewards.catalog.read",
  ],
  viewer: ["fulfilment.read", "analytics.view", "rewards.catalog.read"],
};

const GOVERNMENT_BUNDLE_CAPABILITIES: readonly GovernmentCapability[] = [
  "programmes.read",
  "compliance.read",
  "impact.read",
  "org.settings",
  "analytics.view",
];

export function capabilitiesForGovernmentRole(
  role: string | null | undefined,
): GovernmentCapability[] {
  if (!isPartnerMembershipRole(role)) return [];
  if (role === "partner_operations_manager" || role === "manager" || role === "staff") return [];
  return GOVERNMENT_BUNDLE_CAPABILITIES.filter(capability => capability !== "org.settings" || role === "owner");
}

export function hasGovernmentCapability(
  capabilities: readonly GovernmentCapability[],
  capability: GovernmentCapability,
): boolean {
  return capabilities.includes(capability);
}

export function isPartnerMembershipRole(
  value: string | null | undefined,
): value is PartnerMembershipRole {
  return (
    value === "owner" ||
    value === "manager" ||
    value === "partner_operations_manager" ||
    value === "staff" ||
    value === "viewer"
  );
}

export function capabilitiesForMembershipRole(
  role: string | null | undefined,
): PartnerCapability[] {
  if (!isPartnerMembershipRole(role)) return [];
  return [...BUNDLE_CAPABILITIES[role]];
}

export function hasPartnerCapability(
  capabilities: readonly PartnerCapability[],
  capability: PartnerCapability,
): boolean {
  return capabilities.includes(capability);
}

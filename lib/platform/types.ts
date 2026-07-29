/**
 * Platform API transport types (movrr-admin /api/v1).
 * Thin client types — no fulfilment business rules.
 */

export type PlatformSuccessEnvelope<T> = {
  data: T;
  correlationId: string;
};

export type PlatformErrorEnvelope = {
  error: {
    kind: string;
    message: string;
  };
  correlationId: string | null;
};

export class PlatformApiError extends Error {
  readonly kind: string;
  readonly status: number;
  readonly correlationId: string | null;

  constructor(params: {
    kind: string;
    message: string;
    status: number;
    correlationId?: string | null;
  }) {
    super(params.message);
    this.name = "PlatformApiError";
    this.kind = params.kind;
    this.status = params.status;
    this.correlationId = params.correlationId ?? null;
  }
}

/** Membership roles returned by Platform Organisation model. */
export type PartnerMembershipRole = "owner" | "manager" | "staff" | "viewer";

/**
 * Capability strings used only for UI gating.
 * Server remains authoritative — never invent accept/reject rules locally.
 */
export type PartnerCapability =
  | "fulfilment.read"
  | "fulfilment.validate"
  | "fulfilment.confirm"
  | "resources.manage"
  | "rewards.catalog.read"
  | "rewards.manage"
  | "staff.manage"
  | "analytics.view";

/** Raw GET /api/v1/partners/me payload. */
export type PartnerMeResponse = {
  organisationId: string;
  role: string | null;
  type: "reward_partner";
};

import { redirect } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PRODUCT_ROLES, type ProductRole } from "@/lib/constants";
import { logger } from "@/lib/logger";
import {
  capabilitiesForMembershipRole,
  capabilitiesForGovernmentRole,
  isPartnerMembershipRole,
} from "@/lib/platform/capabilities";
import { platformFetch } from "@/lib/platform/client";
import {
  PlatformApiError,
  type PartnerMeResponse,
  type GovernmentMeResponse,
} from "@/lib/platform/types";
import type { AppUser, PartnerContext, GovernmentContext } from "@/schemas";

/**
 * Session shape decision (Plan 4):
 * `partnerContext` is sourced from Platform `GET /api/v1/partners/me`.
 * Organisation membership + role come from that endpoint — movrr-app does not
 * duplicate org tables. Presentation capabilities are derived from the membership
 * role for UI gating only; the Platform remains authoritative for mutations.
 */
export type ProductSession = {
  authUser: SupabaseAuthUser;
  appUser: AppUser;
  riderProfile?: {
    id: string;
    city?: string | null;
    country?: string | null;
    vehicle_type?: string | null;
    is_certified?: boolean | null;
    emergency_contact?: string | null;
    emergency_phone?: string | null;
  } | null;
  advertiserProfile?: {
    id: string;
    company_name?: string | null;
    company_email?: string | null;
    website?: string | null;
    industry?: string | null;
    language?: string | null;
    timezone?: string | null;
    email_notifications?: boolean | null;
    campaign_updates?: boolean | null;
  } | null;
  partnerContext?: PartnerContext | null;
  governmentContext?: GovernmentContext | null;
};

type ProductIdentity = {
  authUser: SupabaseAuthUser;
  appUser: AppUser;
};

function isProductRole(role: string | null | undefined): role is ProductRole {
  return PRODUCT_ROLES.includes(role as ProductRole);
}

function toPartnerContext(me: PartnerMeResponse): PartnerContext {
  const membershipRole = isPartnerMembershipRole(me.role) ? me.role : null;
  return {
    organisationId: me.organisationId,
    membershipRole,
    orgType: "reward_partner",
    capabilities: capabilitiesForMembershipRole(membershipRole),
  };
}

/**
 * Attempts Platform partner membership discovery.
 * Returns null when the user is not an organisation principal (or API unreachable).
 */
export async function fetchPartnerContext(): Promise<PartnerContext | null> {
  try {
    const me = await platformFetch<PartnerMeResponse>("/partners/me");
    if (!me?.organisationId) return null;
    return toPartnerContext(me);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.kind === "unauthenticated" ||
        error.kind === "permission_denied" ||
        error.kind === "BusinessFailure" ||
        error.kind === "unrecognised_principal"
      ) {
        return null;
      }
      logger.warn("Platform partners/me failed", error.message);
      return null;
    }
    logger.warn(
      "Platform partners/me unexpected error",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function toGovernmentContext(me: GovernmentMeResponse): GovernmentContext {
  const membershipRole = isPartnerMembershipRole(me.role) ? me.role : null;
  return {
    organisationId: me.organisationId,
    membershipRole,
    orgType: "government",
    name: me.name ?? null,
    status: me.status ?? null,
    capabilities: capabilitiesForGovernmentRole(membershipRole),
  };
}

/**
 * Attempts Platform government membership discovery.
 * Returns null when the user is not a government org principal (or API unreachable).
 */
export async function fetchGovernmentContext(): Promise<GovernmentContext | null> {
  try {
    const me = await platformFetch<GovernmentMeResponse>("/government/me");
    if (!me?.organisationId) return null;
    return toGovernmentContext(me);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.kind === "unauthenticated" ||
        error.kind === "permission_denied" ||
        error.kind === "BusinessFailure" ||
        error.kind === "unrecognised_principal"
      ) {
        return null;
      }
      logger.warn("Platform government/me failed", error.message);
      return null;
    }
    logger.warn(
      "Platform government/me unexpected error",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function getAuthenticatedAppUser(): Promise<ProductIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logger.warn("Failed to resolve auth user", authError.message);
    return null;
  }

  if (!authUser) return null;

  const admin = createSupabaseAdminClient();
  const { data: appUserRow, error: appUserError } = await admin
    .from("user")
    .select("id, email, name, phone, role, status, avatar_url, organization, language_preference")
    .eq("id", authUser.id)
    .maybeSingle();

  if (appUserError) {
    logger.error("Failed to resolve product user", appUserError.message);
    return null;
  }

  if (!appUserRow) {
    return null;
  }

  // Prefer declared product roles; allow active users through so /partners/me can
  // discover organisation membership without requiring admin_users.
  let role: ProductRole | null = isProductRole(appUserRow.role)
    ? appUserRow.role
    : null;

  if (!role) {
    const partnerContext = await fetchPartnerContext();
    if (partnerContext) {
      role = "partner";
    } else {
      const governmentContext = await fetchGovernmentContext();
      if (governmentContext) role = "government";
    }
  }

  if (!role) return null;

  return {
    authUser,
    appUser: {
      id: appUserRow.id,
      authUserId: authUser.id,
      email: appUserRow.email,
      name: appUserRow.name ?? appUserRow.email,
      role,
      status: appUserRow.status ?? "active",
      avatarUrl: appUserRow.avatar_url,
      phone: appUserRow.phone,
      organization: appUserRow.organization,
      languagePreference: appUserRow.language_preference ?? "en",
    },
  };
}

export async function getRiderProductSession(identity?: ProductIdentity): Promise<ProductSession | null> {
  const resolvedIdentity = identity ?? (await getAuthenticatedAppUser());
  if (!resolvedIdentity || resolvedIdentity.appUser.role !== "rider") return null;

  const admin = createSupabaseAdminClient();
  const {
    data: riderRows,
    error: riderProfileError,
  } = await admin
    .from("rider")
    .select(
      "id, city, country, vehicle_type, is_certified, emergency_contact, emergency_phone, created_at",
    )
    .eq("user_id", resolvedIdentity.authUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (riderProfileError) {
    logger.error("Failed to resolve rider product session", riderProfileError.message);
  }

  if ((riderRows?.length ?? 0) > 1) {
    logger.warn(
      "Multiple rider profiles detected for product user; using the newest profile for session defaults",
      resolvedIdentity.authUser.id,
    );
  }

  const latestRider = riderRows?.[0] ?? null;

  return {
    ...resolvedIdentity,
    riderProfile: latestRider
      ? {
          id: latestRider.id,
          city: latestRider.city,
          country: latestRider.country,
          vehicle_type: latestRider.vehicle_type,
          is_certified: latestRider.is_certified,
          emergency_contact: latestRider.emergency_contact,
          emergency_phone: latestRider.emergency_phone,
        }
      : null,
    advertiserProfile: null,
    partnerContext: null,
    governmentContext: null,
  };
}

export async function getAdvertiserProductSession(identity?: ProductIdentity): Promise<ProductSession | null> {
  const resolvedIdentity = identity ?? (await getAuthenticatedAppUser());
  if (!resolvedIdentity || resolvedIdentity.appUser.role !== "advertiser") return null;

  const admin = createSupabaseAdminClient();
  const advertiserProfile = await admin
    .from("advertiser")
    .select("id, company_name, company_email, website, industry, language, timezone, email_notifications, campaign_updates")
    .eq("user_id", resolvedIdentity.authUser.id)
    .maybeSingle();

  return {
    ...resolvedIdentity,
    riderProfile: null,
    advertiserProfile: advertiserProfile.data,
    partnerContext: null,
    governmentContext: null,
  };
}

export async function getGovernmentProductSession(
  identity?: ProductIdentity,
): Promise<ProductSession | null> {
  const resolvedIdentity = identity ?? (await getAuthenticatedAppUser());
  if (!resolvedIdentity) return null;

  const governmentContext = await fetchGovernmentContext();
  if (!governmentContext) return null;

  return {
    authUser: resolvedIdentity.authUser,
    appUser: {
      ...resolvedIdentity.appUser,
      role: "government",
    },
    riderProfile: null,
    advertiserProfile: null,
    partnerContext: null,
    governmentContext,
  };
}

export async function getPartnerProductSession(
  identity?: ProductIdentity,
): Promise<ProductSession | null> {
  const resolvedIdentity = identity ?? (await getAuthenticatedAppUser());
  if (!resolvedIdentity) return null;

  const partnerContext = await fetchPartnerContext();
  if (!partnerContext) return null;

  return {
    authUser: resolvedIdentity.authUser,
    appUser: {
      ...resolvedIdentity.appUser,
      role: "partner",
    },
    riderProfile: null,
    advertiserProfile: null,
    partnerContext,
    governmentContext: null,
  };
}

export async function getCurrentProductSession(): Promise<ProductSession | null> {
  const identity = await getAuthenticatedAppUser();
  if (!identity) return null;

  // Prefer Platform org membership: partner > government > declared role.
  const partnerSession = await getPartnerProductSession(identity);
  if (partnerSession) return partnerSession;

  const governmentSession = await getGovernmentProductSession(identity);
  if (governmentSession) return governmentSession;

  if (identity.appUser.role === "rider") {
    return getRiderProductSession(identity);
  }

  if (identity.appUser.role === "advertiser") {
    return getAdvertiserProductSession(identity);
  }

  if (identity.appUser.role === "partner") {
    return null;
  }

  if (identity.appUser.role === "government") {
    return null;
  }

  return null;
}

export async function requireProductSession(allowedRoles?: ProductRole[]) {
  const identity = await getAuthenticatedAppUser();
  if (!identity) {
    redirect("/auth/signin");
  }

  const session = await getCurrentProductSession();
  if (!session) {
    redirect("/unauthorized");
  }

  if (allowedRoles && !allowedRoles.includes(session.appUser.role)) {
    redirect("/unauthorized");
  }

  // Partner shell requires successful /partners/me (partnerContext present).
  if (
    session.appUser.role === "partner" &&
    !session.partnerContext?.organisationId
  ) {
    redirect("/unauthorized");
  }

  if (
    session.appUser.role === "government" &&
    !session.governmentContext?.organisationId
  ) {
    redirect("/unauthorized");
  }

  return session;
}

export async function requireGovernmentSession() {
  return requireProductSession(["government"]);
}

export async function requirePartnerSession() {
  return requireProductSession(["partner"]);
}

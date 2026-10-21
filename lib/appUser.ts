import { normalizedRiderLocale } from "@/lib/locale";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAccountWorkspaces } from "@/lib/platform/workspaces";
import { redirect } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { type ProductRole } from "@/lib/constants";
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
  advertiserContext?: { organisationId: string; capabilities: string[] };
};

type ProductIdentity = {
  authUser: SupabaseAuthUser;
  appUser: AppUser;
};

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

// Request-scoped only: never retain private identity across server renders.
export const getAuthenticatedAppUser = cache(async (): Promise<ProductIdentity | null> => {
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
  const activeIdentity = await admin.rpc("account_identity_active", { p_user: authUser.id });
  if (activeIdentity.error || activeIdentity.data !== true) return null;
  const { data: appUserRow, error: appUserError } = await admin
    .from("user")
    .select("id, email, name, phone, status, avatar_url, organization")
    .eq("id", authUser.id)
    .maybeSingle();

  if (appUserError) {
    logger.error("Failed to resolve product user", appUserError.message);
    return null;
  }

  if (!appUserRow) {
    return null;
  }
  if (String(appUserRow.status).toLowerCase() !== "active") return null;

  const workspaces = await getAccountWorkspaces();
  const selectedWorkspace = (await cookies()).get("movrr-workspace")?.value;
  let role: ProductRole | null;
  if (selectedWorkspace) {
    role = selectedWorkspace === "rider" ? (workspaces.rider ? "rider" : null) :
      workspaces.memberships.find(member => member.organisationId === selectedWorkspace)?.domain ?? null;
    if (!role) redirect("/workspaces");
  } else {
    if (workspaces.memberships.length + (workspaces.rider ? 1 : 0) > 1) redirect("/workspaces");
    role = workspaces.memberships[0]?.domain ?? (workspaces.rider ? "rider" : null);
  }

  if (!role) return null;
  let riderLocale: ReturnType<typeof normalizedRiderLocale>;
  {
    const preference = await admin.from("user_preferences").select("language").eq("user_id", authUser.id).maybeSingle();
    if (preference.error) throw new Error("Account preferences unavailable");
    riderLocale = normalizedRiderLocale(preference.data?.language);
  }


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
      languagePreference: riderLocale!,
    },
  };
});

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
    .eq("status", "active")
    .limit(2);

  if (riderProfileError) {
    logger.error("Failed to resolve rider product session", riderProfileError.message);
  }

  if ((riderRows?.length ?? 0) > 1) {
    throw new Error("Rider identity requires operational review");
  }

  const latestRider = riderRows?.[0] ?? null;
  if (riderProfileError || !latestRider) return null;

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
  const selectedWorkspace = (await cookies()).get("movrr-workspace")?.value;
  const workspaces = await getAccountWorkspaces();
  const advertiserMemberships = workspaces.memberships.filter(member => member.domain === "advertiser");
  const membership = selectedWorkspace ? advertiserMemberships.find(member => member.organisationId === selectedWorkspace) :
    advertiserMemberships.length === 1 ? advertiserMemberships[0] : undefined;
  if (!membership) {
    if (advertiserMemberships.length > 1) redirect("/workspaces");
    return null;
  }
  const advertiserQuery = admin
    .from("advertiser")
    .select("id, company_name, company_email, website, industry, language, timezone, email_notifications, campaign_updates")
    .eq("organisation_id", membership.organisationId);
  const advertiserProfile = await advertiserQuery.maybeSingle();
  if (advertiserProfile.error || !advertiserProfile.data) return null;

  return {
    ...resolvedIdentity,
    riderProfile: null,
    advertiserProfile: advertiserProfile.data,
    advertiserContext: { organisationId: membership.organisationId, capabilities: membership.capabilities },
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

export const getCurrentProductSession = cache(async (): Promise<ProductSession | null> => {
  const identity = await getAuthenticatedAppUser();
  if (!identity) return null;

  if (identity.appUser.role === "rider") return getRiderProductSession(identity);
  if (identity.appUser.role === "advertiser") return getAdvertiserProductSession(identity);

  // Prefer Platform org membership: partner > government > declared role.
  const [partnerSession, governmentSession] = await Promise.all([
    getPartnerProductSession(identity),
    getGovernmentProductSession(identity),
  ]);
  if (partnerSession) return partnerSession;
  if (governmentSession) return governmentSession;

  if (identity.appUser.role === "partner") {
    return null;
  }

  if (identity.appUser.role === "government") {
    return null;
  }

  return null;
});

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

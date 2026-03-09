import { redirect } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PRODUCT_ROLES, type ProductRole } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { AppUser } from "@/schemas";

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
};

type ProductIdentity = {
  authUser: SupabaseAuthUser;
  appUser: AppUser;
};

function isProductRole(role: string | null | undefined): role is ProductRole {
  return PRODUCT_ROLES.includes(role as ProductRole);
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

  if (!appUserRow || !isProductRole(appUserRow.role)) {
    return null;
  }

  return {
    authUser,
    appUser: {
      id: appUserRow.id,
      authUserId: authUser.id,
      email: appUserRow.email,
      name: appUserRow.name ?? appUserRow.email,
      role: appUserRow.role,
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
  const riderProfile = await admin
    .from("rider")
    .select("id, city, country, vehicle_type, is_certified, emergency_contact, emergency_phone")
    .eq("user_id", resolvedIdentity.authUser.id)
    .maybeSingle();

  return {
    ...resolvedIdentity,
    riderProfile: riderProfile.data,
    advertiserProfile: null,
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
  };
}

export async function getCurrentProductSession(): Promise<ProductSession | null> {
  const identity = await getAuthenticatedAppUser();
  if (!identity) return null;

  if (identity.appUser.role === "rider") {
    return getRiderProductSession(identity);
  }

  if (identity.appUser.role === "advertiser") {
    return getAdvertiserProductSession(identity);
  }

  return null;
}

export async function requireProductSession(allowedRoles?: ProductRole[]) {
  const session = await getCurrentProductSession();
  if (!session) {
    redirect("/auth/signin");
  }

  if (allowedRoles && !allowedRoles.includes(session.appUser.role)) {
    redirect("/unauthorized");
  }

  return session;
}

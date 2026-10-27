import { getPartnerLocale } from "@/lib/partnerLocaleServer";
﻿import { AppSessionProvider } from "@/providers/SessionProvider";
import { PageShell } from "@/components/shared/PageShell";
import { requireProductSession } from "@/lib/appUser";

export async function generateMetadata() {
  const session = await requireProductSession(["rider", "advertiser", "partner", "government"]);
  return session.appUser.role === "partner" ? { manifest: "/partner/manifest.webmanifest", appleWebApp: { capable: true, statusBarStyle: "default" as const, title: "MOVRR Partner" }, icons: { apple: [{ url: "/pwa/partner/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] } } : {};
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireProductSession([
    "rider",
    "advertiser",
    "partner",
    "government",
  ]);
  const shellSession = {
    partnerOrganisationId: session.partnerContext?.organisationId,
    partnerLocale: session.appUser.role === "partner" ? await getPartnerLocale() : undefined,
    authUserId: session.authUser.id,
    role: session.appUser.role,
    name: session.appUser.name,
    email: session.appUser.email,
    avatarUrl: session.appUser.avatarUrl,
  };

  return (
    <AppSessionProvider value={shellSession}>
      <PageShell session={shellSession}>{children}</PageShell>
    </AppSessionProvider>
  );
}

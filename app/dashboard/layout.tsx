import { getPartnerLocale } from "@/lib/partnerLocaleServer";
﻿import { AppSessionProvider } from "@/providers/SessionProvider";
import { PartnerAppStatus } from "@/components/partner/PartnerAppStatus";
import { PageShell } from "@/components/shared/PageShell";
import { requireProductSession } from "@/lib/appUser";

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
    partnerLocale: session.appUser.role === "partner" ? await getPartnerLocale() : undefined,
    authUserId: session.authUser.id,
    role: session.appUser.role,
    name: session.appUser.name,
    email: session.appUser.email,
    avatarUrl: session.appUser.avatarUrl,
  };

  return (
    <AppSessionProvider value={shellSession}>
      <PageShell session={shellSession}>{session.appUser.role === "partner" && <PartnerAppStatus locale={shellSession.partnerLocale} />}{children}</PageShell>
    </AppSessionProvider>
  );
}

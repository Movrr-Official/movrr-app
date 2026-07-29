import { AppSessionProvider } from "@/providers/SessionProvider";
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
  ]);
  const shellSession = {
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

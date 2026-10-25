import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { cookies } from "next/headers";
import { Input } from "@/components/ui/input";
import { StaffTable } from "@/components/partner/StaffTable";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { listPartnerStaff } from "@/services/partner";

export default async function PartnerStaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  const session = await requirePartnerSession();
  const params = await searchParams;
  let invitationUrl: string | undefined;
  try { const saved = JSON.parse((await cookies()).get("movrr-invitation")?.value ?? "null");
    if (saved?.actor === session.authUser.id && saved.organisationId === session.partnerContext!.organisationId && typeof saved.url === "string") invitationUrl = saved.url;
  } catch { /* Invalid/expired receipt has no effect on authorization. */ }
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const canManage = hasPartnerCapability(
    session.partnerContext!.capabilities,
    "staff.manage",
  );

  if (!canManage) {
    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <PageHeader
            title={t("Team")}
            description={t("Manage your team workspace access.")}
          />
          <EmptyState
            title={t("Staff management unavailable")}
            description={t("Your membership role cannot list or manage organisation staff.")}
            iconName="dashboard"
          />
        </div>
      </div>
    );
  }

  let members: Awaited<ReturnType<typeof listPartnerStaff>> = [];
  let listError: string | null = null;
  try {
    members = await listPartnerStaff();
  } catch {
    listError = "Team details are temporarily unavailable. Please try again.";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : listError ? t(listError) : null} />
        <PageHeader
          title={t("Team")}
          description={t("Invite your team and manage their access.")}
        />
        {invitationUrl && <div className="space-y-2"><p>{t("Share this invitation link with the invited account holder.")}</p><Input value={invitationUrl} readOnly /></div>}
        <StaffTable members={members} canManage={canManage} actorRole={session.partnerContext!.membershipRole} />
      </div>
    </div>
  );
}

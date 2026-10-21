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
            title="Staff"
            description="Organisation membership management requires staff.manage."
          />
          <EmptyState
            title="Staff management unavailable"
            description="Your membership role cannot list or manage organisation staff."
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
  } catch (err) {
    listError = err instanceof Error ? err.message : "Failed to load staff";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error ?? listError} />
        <PageHeader
          title="Staff"
          description="Invite and change organisation membership roles through Platform APIs only."
        />
        {invitationUrl && <div className="space-y-2"><p>Invitation link ? share with the invited account holder</p><Input value={invitationUrl} readOnly /></div>}
        <StaffTable members={members} canManage={canManage} actorRole={session.partnerContext!.membershipRole} />
      </div>
    </div>
  );
}

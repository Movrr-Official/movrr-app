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
        <StaffTable members={members} canManage={canManage} />
      </div>
    </div>
  );
}

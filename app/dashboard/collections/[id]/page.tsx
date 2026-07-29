import { CollectionDetail } from "@/components/partner/CollectionDetail";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { getPartnerPendingFulfilment } from "@/services/partner";

export default async function PartnerCollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePartnerSession();
  const { id } = await params;
  const query = await searchParams;
  const success = typeof query.success === "string" ? query.success : null;
  const error = typeof query.error === "string" ? query.error : null;
  const item = await getPartnerPendingFulfilment(id);
  const canConfirm = hasPartnerCapability(
    session.partnerContext!.capabilities,
    "fulfilment.confirm",
  );

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error} />
        <PageHeader
          title="Confirm collection"
          description="Review Platform fulfilment state, then confirm collection via API."
          action={{
            label: "Back to collections",
            href: "/dashboard/collections",
            variant: "outline",
          }}
        />
        {item ? (
          <CollectionDetail item={item} canConfirm={canConfirm} />
        ) : (
          <EmptyState
            title="Fulfilment not in pending list"
            description="It may already be confirmed, expired, or outside your organisation scope."
            iconName="dashboard"
            navigateTo="/dashboard/collections"
            buttonText="Return to collections"
          />
        )}
      </div>
    </div>
  );
}

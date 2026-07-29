import { CollectionsTable } from "@/components/partner/CollectionsTable";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { requirePartnerSession } from "@/lib/appUser";
import { listPartnerPendingFulfilments } from "@/services/partner";

export default async function PartnerCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePartnerSession();
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const items = await listPartnerPendingFulfilments();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error} />
        <PageHeader
          title="Collections"
          description="Pending reward collections for your organisation. Confirmation is handled entirely by the Platform API."
        />
        <CollectionsTable items={items} />
      </div>
    </div>
  );
}

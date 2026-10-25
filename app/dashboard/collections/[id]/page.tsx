import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { randomUUID } from "node:crypto";
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
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  const session = await requirePartnerSession();
  const { id } = await params;
  const query = await searchParams;
  const success = typeof query.success === "string" ? query.success : null;
  const error = typeof query.error === "string" ? query.error : null;
  const item = await getPartnerPendingFulfilment(id);
  const closed = item && ["completed","collected","delivered","dispatched","cancelled","expired","refunded","reversed"].includes(item.state ?? "");
  const canConfirm = hasPartnerCapability(
    session.partnerContext!.capabilities,
    "fulfilment.confirm",
  );

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />
        <PageHeader
          title={t(closed ? "Collection details" : "Confirm collection")}
          description={t(closed ? "View the recorded outcome for this reward." : "Review the reward before handing it to the rider.")}
          action={{
            label: t("Back to collections"),
            href: "/dashboard/collections",
            variant: "outline",
          }}
        />
        {item ? (
          <CollectionDetail initialLocale={locale} item={item} canConfirm={canConfirm} canCancel={hasPartnerCapability(session.partnerContext!.capabilities,"fulfilment.cancel")} operationId={randomUUID()}/>
        ) : (
          <EmptyState
            title={t(success ? "Collection complete" : "Collection unavailable")}
            description={t("It may already be confirmed, expired, or outside your organisation scope.")}
            iconName="dashboard"
            navigateTo="/dashboard/collections"
            buttonText={t("Return to collections")}
          />
        )}
      </div>
    </div>
  );
}

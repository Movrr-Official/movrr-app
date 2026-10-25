import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
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
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  await requirePartnerSession();
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const items = await listPartnerPendingFulfilments();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />
        <PageHeader
          title={t("Collections")}
          description={t("Manage reward collections for your organisation.")}
        />
        <CollectionsTable items={items} />
      </div>
    </div>
  );
}

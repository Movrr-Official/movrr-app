import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { CollectionsTable } from "@/components/partner/CollectionsTable";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { requirePartnerSession } from "@/lib/appUser";
import Link from "next/link";
import { listPartnerFulfilmentHistory, listPartnerPendingFulfilments } from "@/services/partner";

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
  const history = params.view === "history";
  const items = history ? await listPartnerFulfilmentHistory() : await listPartnerPendingFulfilments();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />
        <PageHeader
          title={t("Collections")}
          description={t("Manage reward collections for your organisation.")}
        />
        <nav className="inline-flex gap-1 rounded-xl border border-border bg-background p-1" aria-label={t("Collections")}>
          <Link href="/dashboard/collections" aria-current={!history ? "page" : undefined} className={!history ? "rounded-lg bg-accent px-4 py-3 text-sm font-semibold" : "rounded-lg px-4 py-3 text-sm text-muted-foreground"}>{t("Pending collections")}</Link>
          <Link href="/dashboard/collections?view=history" aria-current={history ? "page" : undefined} className={history ? "rounded-lg bg-accent px-4 py-3 text-sm font-semibold" : "rounded-lg px-4 py-3 text-sm text-muted-foreground"}>{t("Collection history")}</Link>
        </nav>
        <CollectionsTable items={items} history={history} />
      </div>
    </div>
  );
}

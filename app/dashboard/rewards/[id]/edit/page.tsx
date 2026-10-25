import { RewardImageField } from "@/components/partner/RewardImageField";
import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import Link from "next/link";
import { updateRewardCatalogAction } from "@/app/actions/partner";
import { StatusToast } from "@/components/form/StatusToast";
import { RewardEditStatus } from "@/components/partner/RewardEditStatus";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { getPartnerCatalogItem } from "@/lib/platform/partnerCatalogPlatform";
import { notFound, redirect } from "next/navigation";

export default async function PartnerEditRewardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  const session = await getCurrentProductSession();
  if (!session?.partnerContext) redirect("/unauthorized");

  const canManage = hasPartnerCapability(
    session.partnerContext.capabilities,
    "rewards.manage",
  );
  if (!canManage) redirect("/dashboard/rewards");

  const { id } = await params;
  const sp = await searchParams;
  const success = typeof sp.success === "string" ? sp.success : null;
  const error = typeof sp.error === "string" ? sp.error : null;

  const item = await getPartnerCatalogItem(id);
  if (!item) notFound();
  const merchantReference = /^PARTNER-[0-9a-f-]{36}$/i.test(item.sku ?? "") ? "" : item.sku ?? "";

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title={t("Edit reward")}
          description={t("Review and update your reward.")}
        />
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("Reward details")}</CardTitle>
            <CardDescription>{t("Keep your reward details ready for MOVRR review.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRewardCatalogAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="catalogItemId" value={id} /><input type="hidden" name="expectedUpdatedAt" value={item.updatedAt ?? ""} />
              <RewardImageField locale={locale} initialUrl={item.thumbnailUrl} />
              <label className="partner-form-label md:col-span-2">{t("Title")}<Input
                name="title"
                defaultValue={item.title ?? ""}
                placeholder={t("Title")}
                required
                className="md:col-span-2"
              /></label>
              <label className="partner-form-label md:col-span-2">{t("Description")}<Textarea
                name="description"
                defaultValue={item.description ?? ""}
                placeholder={t("Description")}
                className="md:col-span-2"
              /></label>
              <label className="partner-form-label ">{t("Points cost")}<Input
                name="pointsCost"
                type="number"
                defaultValue={item.pointsCost}
                min={0}
              /></label>
              <label className="partner-form-label ">{t("Stock available")}<Input
                name="stockAvailable"
                type="number"
                defaultValue={item.stockAvailable}
                min={0}
              /></label>
              <label className="partner-form-label ">{t("Your reference (optional)")}<Input name="sku" defaultValue={merchantReference} placeholder={t("Your reference (optional)")} /></label>
              <label className="partner-form-label ">{t("Category")}<Input
                name="category"
                defaultValue={item.category ?? ""}
                placeholder={t("Category")}
              /></label>
              <RewardEditStatus status={item.status} locale={locale} />
              <div className="flex gap-3 md:col-span-2">
                <Button asChild variant="outline"><Link href="/dashboard/rewards">{t("Back to rewards")}</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

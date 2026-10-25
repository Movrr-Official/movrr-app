import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import Link from "next/link";
import { updateRewardCatalogAction } from "@/app/actions/partner";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
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
            <CardDescription>{t("Update the reward details. Changes are checked before saving.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRewardCatalogAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="catalogItemId" value={id} /><input type="hidden" name="expectedUpdatedAt" value={item.updatedAt ?? ""} />
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
              <label className="partner-form-label ">{t("Internal reference")}<Input name="sku" defaultValue={item.sku ?? ""} placeholder={t("Internal reference")} /></label>
              <label className="partner-form-label ">{t("Category")}<Input
                name="category"
                defaultValue={item.category ?? ""}
                placeholder={t("Category")}
              /></label>
              <label className="partner-form-label md:col-span-2">{t("Status")}<select
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                defaultValue={item.status ?? "draft"}
              >
                <option value="draft">{t("Draft")}</option>
                <option value="active">{t("Active")}</option>
                <option value="paused">{t("Paused")}</option>
                <option value="archived">{t("Archived")}</option>
              </select></label>
              <div className="flex gap-3 md:col-span-2">
                <SubmitButton type="submit" pendingLabel={t("Saving")}>{t("Save changes")}</SubmitButton>
                <Link
                  href="/dashboard/rewards"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm"
                >{t("Back to rewards")}</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

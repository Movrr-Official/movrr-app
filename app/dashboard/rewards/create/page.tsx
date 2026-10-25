import { RewardImageField } from "@/components/partner/RewardImageField";
import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import Link from "next/link";
import { createRewardCatalogAction } from "@/app/actions/partner";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
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
import { redirect } from "next/navigation";

export default async function PartnerCreateRewardPage({
  searchParams,
}: {
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

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title={t("Create reward")}
          description={t("Prepare a reward for your customers.")}
        />
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("Reward details")}</CardTitle>
            <CardDescription>{t("Rewards start as drafts. MOVRR approves availability after voucher inventory and delivery details are ready.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRewardCatalogAction} className="grid gap-4 md:grid-cols-2">
              <RewardImageField locale={locale} />
              <label className="partner-form-label md:col-span-2">{t("Title")}<Input name="title" placeholder={t("Title")} required className="md:col-span-2" /></label>
              <label className="partner-form-label md:col-span-2">{t("Description")}<Textarea
                name="description"
                placeholder={t("Description")}
                className="md:col-span-2"
              /></label>
              <label className="partner-form-label ">{t("Points cost")}<Input name="pointsCost" type="number" placeholder={t("Points cost")} min={0} required /></label>
              <label className="partner-form-label ">{t("Stock available")}<Input name="stockAvailable" type="number" placeholder={t("Stock available")} min={0} /></label>
              <label className="partner-form-label ">{t("Your reference (optional)")}<Input name="sku" placeholder={t("Your reference (optional)")} /></label>
              <label className="partner-form-label ">{t("Category")}<Input name="category" placeholder={t("Category")} /></label>
              <div className="flex gap-3 md:col-span-2">
                <SubmitButton type="submit" pendingLabel={t("Creating")}>{t("Create item")}</SubmitButton>
                <Button asChild variant="outline"><Link href="/dashboard/rewards">{t("Cancel")}</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

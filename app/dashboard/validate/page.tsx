import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { ValidateTokenForm } from "@/components/partner/ValidateTokenForm";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";

export default async function PartnerValidatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  const session = await requirePartnerSession();
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const canValidate = hasPartnerCapability(
    session.partnerContext!.capabilities,
    "fulfilment.validate",
  );

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ? t(error) : null} />
        <PageHeader
          title={t("Reward redemption")}
          description={t("Check a rider reward securely before handover.")}
        />
        <ValidateTokenForm initialLocale={locale} canValidate={canValidate} />
      </div>
    </div>
  );
}

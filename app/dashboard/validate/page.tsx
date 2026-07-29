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
        <StatusToast success={success} error={error} />
        <PageHeader
          title="Validate"
          description="Submit a fulfilment token to the Platform API. Success and failure reasons are returned by the server."
        />
        <ValidateTokenForm canValidate={canValidate} />
      </div>
    </div>
  );
}

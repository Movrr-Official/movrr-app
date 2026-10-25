import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { importResourceCodesAction } from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { StatusToast } from "@/components/form/StatusToast";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePartnerSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { listPartnerResources } from "@/services/partner";

export default async function PartnerResourcesPage({
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
  const canManage = hasPartnerCapability(
    session.partnerContext!.capabilities,
    "resources.manage",
  );

  let resources: Awaited<ReturnType<typeof listPartnerResources>> = [];
  let listError: string | null = null;
  if (canManage) {
    try {
      resources = await listPartnerResources();
    } catch {
      listError =
        "Voucher inventory is temporarily unavailable. Please try again.";
    }
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success ? t(success) : null} error={error ?? listError} />
        <PageHeader
          title={t("Resources")}
          description={t("Manage the voucher codes available for your rewards.")}
        />

        {!canManage ? (
          <EmptyState
            title={t("Resources unavailable")}
            description={t("Your membership role cannot manage fulfilment resources.")}
            iconName="file"
          />
        ) : (
          <>
            <Card className="border-border">
              <CardHeader>
                <CardTitle>{t("Resource pools")}</CardTitle>
                <CardDescription>{t("Voucher inventory for your organisation.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.length ? (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {resource.name ?? t("Voucher pool")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{t("Pool")} {resource.poolCount ?? "—"}
                        </Badge>
                        <Badge variant="secondary">{t("Available")} {resource.availableCount ?? "—"}
                        </Badge>
                        {resource.status ? (
                          <Badge className="capitalize">{t(resource.status)}</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("No voucher pools yet. Contact MOVRR to prepare your reward inventory.")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>{t("Import codes")}</CardTitle>
                <CardDescription>{t("Add the codes supplied by your voucher provider.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={importResourceCodesAction}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <label className="space-y-2 text-sm">{t("Voucher pool")}<select name="resourceId" required aria-label={t("Voucher pool")} className="block h-12 w-full rounded-md border border-input bg-background px-3" defaultValue="">
                      <option value="" disabled>{t("Select a voucher pool")}</option>
                      {resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name ?? t("Voucher pool")}</option>)}
                    </select>
                  </label>
                  <div className="md:col-span-2">
                    <Textarea
                      name="codes"
                      placeholder={t("One code per line (or comma-separated)")}
                      rows={6}
                      required
                    />
                  </div>
                  <div>
                    <SubmitButton pendingLabel={t("Importing…")}>{t("Import codes")}</SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

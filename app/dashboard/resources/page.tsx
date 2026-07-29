import { importResourceCodesAction } from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { StatusToast } from "@/components/form/StatusToast";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
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
    } catch (err) {
      listError =
        err instanceof Error ? err.message : "Failed to load resources";
    }
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error ?? listError} />
        <PageHeader
          title="Resources"
          description="Fulfilment resource pools for your organisation. Import only when Platform grants resources.manage."
        />

        {!canManage ? (
          <EmptyState
            title="Resources unavailable"
            description="Your membership role cannot manage fulfilment resources."
            iconName="file"
          />
        ) : (
          <>
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Resource pools</CardTitle>
                <CardDescription>
                  Read model from GET /api/v1/partners/resources.
                </CardDescription>
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
                          {resource.name ?? resource.id}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          {resource.id}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Pool {resource.poolCount ?? "—"}
                        </Badge>
                        <Badge variant="secondary">
                          Available {resource.availableCount ?? "—"}
                        </Badge>
                        {resource.status ? (
                          <Badge className="capitalize">{resource.status}</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No resource pools returned by Platform yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Import codes</CardTitle>
                <CardDescription>
                  Posts codes to Platform with an Idempotency-Key. No local pool
                  mutation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={importResourceCodesAction}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <Input
                    name="resourceId"
                    placeholder="Resource id"
                    required
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      name="codes"
                      placeholder="One code per line (or comma-separated)"
                      rows={6}
                      required
                    />
                  </div>
                  <div>
                    <SubmitButton pendingLabel="Importing…">
                      Import codes
                    </SubmitButton>
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

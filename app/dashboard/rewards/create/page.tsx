import Link from "next/link";
import { createRewardCatalogAction } from "@/app/actions/partner";
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
import { redirect } from "next/navigation";

export default async function PartnerCreateRewardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
          title="Create reward"
          description="POST /api/v1/partners/rewards — add a catalog item."
        />
        <StatusToast success={success} error={error} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Catalog item</CardTitle>
            <CardDescription>
              New items are created as draft unless set to active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRewardCatalogAction} className="grid gap-4 md:grid-cols-2">
              <Input name="title" placeholder="Title" required className="md:col-span-2" />
              <Textarea
                name="description"
                placeholder="Description"
                className="md:col-span-2"
              />
              <Input name="pointsCost" type="number" placeholder="Points cost" min={1} required />
              <Input name="stockAvailable" type="number" placeholder="Stock available" min={0} />
              <Input name="sku" placeholder="SKU" />
              <Input name="category" placeholder="Category" />
              <select
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                defaultValue="draft"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
              <div className="flex gap-3 md:col-span-2">
                <SubmitButton type="submit" pendingLabel="Creating">
                  Create item
                </SubmitButton>
                <Link
                  href="/dashboard/rewards"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

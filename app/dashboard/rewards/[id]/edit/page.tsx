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
          title="Edit reward"
          description={`PATCH /api/v1/partners/rewards/${id}`}
        />
        <StatusToast success={success} error={error} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Catalog item</CardTitle>
            <CardDescription>Update partner reward catalog item.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRewardCatalogAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="catalogItemId" value={id} />
              <Input
                name="title"
                defaultValue={item.title ?? ""}
                placeholder="Title"
                required
                className="md:col-span-2"
              />
              <Textarea
                name="description"
                defaultValue={item.description ?? ""}
                placeholder="Description"
                className="md:col-span-2"
              />
              <Input
                name="pointsCost"
                type="number"
                defaultValue={item.pointsCost ?? 0}
                min={1}
              />
              <Input
                name="stockAvailable"
                type="number"
                defaultValue={item.stockAvailable ?? 0}
                min={0}
              />
              <Input name="sku" defaultValue={item.sku ?? ""} placeholder="SKU" />
              <Input
                name="category"
                defaultValue={item.category ?? ""}
                placeholder="Category"
              />
              <select
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                defaultValue={item.status ?? "draft"}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
              <div className="flex gap-3 md:col-span-2">
                <SubmitButton type="submit" pendingLabel="Saving">
                  Save changes
                </SubmitButton>
                <Link
                  href="/dashboard/rewards"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm"
                >
                  Back to rewards
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

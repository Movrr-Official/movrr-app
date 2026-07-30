import Link from "next/link";
import { updateCampaignAction, updateCampaignStatusAction } from "@/app/actions/advertiser";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { getAdvertiserCampaign } from "@/lib/platform/advertiserCampaignPlatform";
import {
  CAMPAIGN_LIFECYCLE_STATUSES,
  campaignLifecycleLabel,
} from "@/lib/platform/capabilityRegistry.types";
import { notFound, redirect } from "next/navigation";

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "advertiser") redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const success = typeof sp.success === "string" ? sp.success : null;
  const error = typeof sp.error === "string" ? sp.error : null;

  const campaign = await getAdvertiserCampaign(id);
  if (!campaign) notFound();

  const isDraft = campaign.lifecycleStatus === "draft";

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Edit campaign"
          description={`Update draft campaign ${campaign.name}.`}
        />
        <StatusToast success={success} error={error} />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {campaignLifecycleLabel(
              campaign.lifecycleStatus as Parameters<typeof campaignLifecycleLabel>[0],
            )}
          </Badge>
        </div>

        {isDraft ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Campaign details</CardTitle>
              <CardDescription>
                PATCH /api/v1/campaigns/:id — draft edits only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateCampaignAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="campaignId" value={id} />
                <Input
                  name="name"
                  defaultValue={campaign.name}
                  placeholder="Campaign name"
                  required
                  className="md:col-span-2"
                />
                <Textarea
                  name="description"
                  defaultValue={campaign.description ?? ""}
                  placeholder="Description"
                  className="md:col-span-2"
                />
                <Input
                  name="budget"
                  type="number"
                  defaultValue={campaign.budget ?? 0}
                  min={0}
                  step="0.01"
                />
                <Input
                  name="startDate"
                  type="date"
                  defaultValue={campaign.startDate?.slice(0, 10) ?? ""}
                />
                <Input
                  name="endDate"
                  type="date"
                  defaultValue={campaign.endDate?.slice(0, 10) ?? ""}
                />
                <Input
                  name="targetZones"
                  defaultValue={campaign.targetZones.join(", ")}
                  placeholder="Target zones"
                  className="md:col-span-2"
                />
                <SubmitButton type="submit" pendingLabel="Saving">
                  Save changes
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Published campaign</CardTitle>
              <CardDescription>
                Only draft campaigns can be edited. Use status transitions below.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Lifecycle status</CardTitle>
            <CardDescription>
              POST /api/v1/campaigns/:id/status — Platform-managed transitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {CAMPAIGN_LIFECYCLE_STATUSES.map((status) => (
              <form key={status} action={updateCampaignStatusAction}>
                <input type="hidden" name="campaignId" value={id} />
                <input type="hidden" name="status" value={status} />
                <SubmitButton
                  type="submit"
                  size="sm"
                  variant={campaign.lifecycleStatus === status ? "default" : "outline"}
                  pendingLabel="Updating"
                >
                  {campaignLifecycleLabel(status)}
                </SubmitButton>
              </form>
            ))}
          </CardContent>
        </Card>

        <Link href="/dashboard/campaigns" className="text-sm text-primary hover:underline">
          Back to campaigns
        </Link>
      </div>
    </div>
  );
}

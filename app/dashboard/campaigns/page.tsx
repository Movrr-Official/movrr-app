import Link from "next/link";
import {
  confirmCampaignAction,
  optInCampaignAction,
  withdrawCampaignAction,
} from "@/app/actions/rider";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdvertiserCampaignList } from "@/components/advertiser/CampaignList";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getRiderDashboardData } from "@/services/rider";
import { getCurrentProductSession } from "@/lib/appUser";
import { listRiderCampaigns } from "@/lib/platform/campaignPlatform";
import { getGovernmentProgrammes } from "@/lib/platform/governmentPlatform";
import {
  CAMPAIGN_LIFECYCLE_LABELS,
  type CampaignLifecycleStatus,
} from "@/lib/platform/capabilityRegistry.types";
import { formatRelativeDate } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function DashboardCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  if (session?.appUser.role === "government") {
    let programmes: Awaited<ReturnType<typeof getGovernmentProgrammes>> | null = null;
    try {
      programmes = await getGovernmentProgrammes();
    } catch {
      programmes = null;
    }

    const campaigns = programmes?.campaigns ?? [];

    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <PageHeader
            title="Campaigns"
            description="Programme-linked campaigns visible to your government organisation."
          />
          {campaigns.length ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Active programme campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={String(campaign.id)}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <p className="font-semibold">{String(campaign.name ?? campaign.id)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {campaign.lifecycle_status || campaign.lifecycleStatus ? (
                        <Badge variant="outline" className="capitalize">
                          {String(
                            campaign.lifecycle_status ?? campaign.lifecycleStatus,
                          ).replace(/_/g, " ")}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No programme campaigns"
              description="Campaigns linked to government programmes will appear here."
              iconName="megaphone"
            />
          )}
        </div>
      </div>
    );
  }

  if (session?.appUser.role === "advertiser") {
    const dashboard = await getAdvertiserDashboardData();
    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <StatusToast success={success} error={error} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PageHeader
              title="Campaigns"
              description="Manage your advertiser campaign portfolio."
            />
            <Button asChild>
              <Link href="/dashboard/campaigns/create">Create campaign</Link>
            </Button>
          </div>
          {dashboard.campaigns.length ? (
            <AdvertiserCampaignList campaigns={dashboard.campaigns} showCreate />
          ) : (
            <EmptyState
              title="No campaigns yet"
              description="Create your first campaign draft to get started."
              iconName="megaphone"
              navigateTo="/dashboard/campaigns/create"
              buttonText="Create campaign"
            />
          )}
        </div>
      </div>
    );
  }

  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  let platformCampaigns: Awaited<ReturnType<typeof listRiderCampaigns>> = [];
  let platformError: string | null = null;
  try {
    platformCampaigns = await listRiderCampaigns();
  } catch (err) {
    platformError = err instanceof Error ? err.message : "Failed to load campaigns";
  }

  const dashboard = await getRiderDashboardData();
  const campaigns =
    platformCampaigns.length > 0
      ? platformCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.lifecycleStatus,
          campaignType: c.campaignType,
          startDate: c.startDate,
          endDate: c.endDate,
          targetZones: c.targetZones,
          signupStatus: c.signupStatus,
        }))
      : dashboard.campaigns.map((c) => ({ ...c, signupStatus: undefined }));

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error ?? platformError} />
        {campaigns.length ? (
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="border-border">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {campaign.name}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {campaign.description ||
                          "Campaign briefing will be shared by MOVRR operations."}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {CAMPAIGN_LIFECYCLE_LABELS[
                        campaign.status as CampaignLifecycleStatus
                      ] ?? campaign.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="font-medium text-foreground">Campaign type</p>
                      <p>
                        {campaign.campaignType
                          ? campaign.campaignType.replace(/_/g, " ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Signup status</p>
                      <p className="capitalize">
                        {campaign.signupStatus?.replace(/_/g, " ") ?? "Not joined"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Starts</p>
                      <p>{formatRelativeDate(campaign.startDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Ends</p>
                      <p>{formatRelativeDate(campaign.endDate)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!campaign.signupStatus ? (
                      <form action={optInCampaignAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <SubmitButton type="submit" size="sm" pendingLabel="Joining">
                          Join campaign
                        </SubmitButton>
                      </form>
                    ) : null}
                    {campaign.signupStatus &&
                    campaign.signupStatus !== "withdrawn" &&
                    campaign.signupStatus !== "confirmed" ? (
                      <>
                        <form action={withdrawCampaignAction}>
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <SubmitButton
                            type="submit"
                            size="sm"
                            variant="outline"
                            pendingLabel="Withdrawing"
                          >
                            Withdraw
                          </SubmitButton>
                        </form>
                        <form action={confirmCampaignAction}>
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <SubmitButton
                            type="submit"
                            size="sm"
                            variant="secondary"
                            pendingLabel="Confirming"
                          >
                            Confirm participation
                          </SubmitButton>
                        </form>
                      </>
                    ) : null}
                  </div>

                  {(campaign.status === "active" || campaign.status === "confirmed") &&
                  campaign.signupStatus === "confirmed" ? (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-medium">Ready to ride</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Continue route execution in the MOVRR mobile app.
                      </p>
                      <Button asChild className="mt-3" size="sm">
                        <a href="movrrapp://routes">Continue in MOVRR app</a>
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No campaigns assigned"
            description="Campaign assignments will appear here when operations assigns them to you."
            iconName="megaphone"
          />
        )}
      </div>
    </div>
  );
}

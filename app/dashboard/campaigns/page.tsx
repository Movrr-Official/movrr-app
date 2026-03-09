import { EmptyState } from "@/components/shared/EmptyState";
import { AdvertiserCampaignList } from "@/components/advertiser/CampaignList";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getRiderDashboardData } from "@/services/rider";
import { getCurrentProductSession } from "@/lib/appUser";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format";

export default async function DashboardCampaignsPage() {
  const session = await getCurrentProductSession();

  if (session?.appUser.role === "advertiser") {
    const dashboard = await getAdvertiserDashboardData();
    if (!dashboard.campaigns.length) {
      return (
        <EmptyState
          title="No campaign visibility yet"
          description="Campaigns assigned to your advertiser account will appear here after internal MOVRR operations publishes them."
        />
      );
    }
    return <AdvertiserCampaignList campaigns={dashboard.campaigns} />;
  }

  const dashboard = await getRiderDashboardData();
  const campaigns = dashboard.campaigns;
  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Assigned Campaigns"
        description="Visibility into the campaigns currently assigned to your rider account. Live execution remains managed in MOVRR Mobile."
      />
      {campaigns.length ? (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-card border-0">
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
                    {campaign.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">Campaign type</p>
                  <p>
                    {campaign.campaignType
                      ? campaign.campaignType.replace(/_/g, " ")
                      : "Not specified"}
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
                <div>
                  <p className="font-medium text-foreground">Zones</p>
                  <p>
                    {campaign.targetZones.length
                      ? campaign.targetZones.join(", ")
                      : "Assigned in mobile briefing"}
                  </p>
                </div>
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
  );
}

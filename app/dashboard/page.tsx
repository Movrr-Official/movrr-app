import { EmptyState } from "@/components/shared/EmptyState";
import { StatsCard } from "@/components/stats/StatsCard";
import { RiderOverview } from "@/components/rider/Overview";
import { AdvertiserCampaignList } from "@/components/advertiser/CampaignList";
import { PartnerOverview } from "@/components/partner/PartnerOverview";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getPartnerDashboard } from "@/services/partner";
import { getGovernmentProgrammes } from "@/lib/platform/governmentPlatform";
import {
  Bell,
  CircleDollarSign,
  LineChart,
  MapPinned,
  Megaphone,
  Trophy,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentProductSession();

  if (session?.appUser.role === "partner") {
    const dashboard = await getPartnerDashboard();
    return (
      <div className="page-canvas">
        <PartnerOverview dashboard={dashboard} />
      </div>
    );
  }

  if (session?.appUser.role === "government") {
    let programmes: Awaited<ReturnType<typeof getGovernmentProgrammes>> | null = null;
    try {
      programmes = await getGovernmentProgrammes();
    } catch {
      programmes = null;
    }

    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <StatsCard
              title="Active campaigns"
              value={programmes?.kpis.activeCampaigns ?? 0}
              description="Campaigns in active programme delivery"
              icon={Megaphone}
            />
            <StatsCard
              title="Total impressions"
              value={programmes?.kpis.totalImpressions ?? 0}
              description="Recorded programme impression volume"
              icon={LineChart}
            />
            <StatsCard
              title="Verified rides"
              value={programmes?.kpis.verifiedRides ?? 0}
              description="Rides passing verification"
              icon={Users}
            />
            <StatsCard
              title="Pending verification"
              value={programmes?.kpis.pendingVerification ?? 0}
              description="Rides awaiting compliance review"
              icon={Bell}
            />
          </div>
          {programmes?.campaigns.length ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Programme campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {programmes.campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={String(campaign.id)}
                    className="rounded-xl border border-border/60 p-3 text-sm"
                  >
                    {String(campaign.name ?? campaign.id)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No programme data yet"
              description="Government programme KPIs will appear when Platform returns programme data."
              iconName="dashboard"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <StatsCard
              title="Active campaigns"
              value={dashboard.analytics.activeCampaigns}
              description="Campaigns currently delivering in market"
              icon={Megaphone}
            />
            <StatsCard
              title="Budget exposure"
              value={formatCurrency(dashboard.analytics.totalBudget)}
              description="Total configured campaign budget"
              icon={CircleDollarSign}
            />
            <StatsCard
              title="Impressions"
              value={dashboard.analytics.totalImpressions}
              description="Recorded campaign impression volume"
              icon={LineChart}
            />
            <StatsCard
              title="Rider visibility"
              value={dashboard.campaigns.reduce(
                (sum, campaign) => sum + campaign.ridersAssigned,
                0,
              )}
              description="Participants visible across your campaigns"
              icon={Users}
            />
          </div>
          {dashboard.campaigns.length ? (
            <AdvertiserCampaignList
              campaigns={dashboard.campaigns.slice(0, 5)}
            />
          ) : (
            <EmptyState
              title="No advertiser campaigns yet"
              description="Campaigns assigned to your advertiser account will appear here once MOVRR operations publishes them."
              iconName="dashboard"
            />
          )}
        </div>
      </div>
    );
  }

  const dashboard = await getRiderDashboardData();
  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <StatsCard
            title="Active campaigns"
            value={dashboard.activeCampaigns}
            description="Campaigns currently assigned to you"
            icon={Megaphone}
          />
          <StatsCard
            title="Active routes"
            value={dashboard.activeRoutes}
            description="Route posture synced from your mobile operational flow"
            icon={MapPinned}
          />
          <StatsCard
            title="Rewards balance"
            value={dashboard.pointsBalance}
            description="Available points ready for redemption"
            icon={Trophy}
          />
          <StatsCard
            title="Last active"
            value={formatRelativeDate(dashboard.lastActive)}
            description="Derived from your latest authenticated product activity"
            icon={Bell}
          />
        </div>
        {dashboard.campaigns.length || dashboard.routes.length ? (
          <RiderOverview data={dashboard} />
        ) : (
          <EmptyState
            title="No active rider workload"
            description="You do not have assigned campaigns or route visibility yet."
            iconName="dashboard"
          />
        )}
      </div>
    </div>
  );
}

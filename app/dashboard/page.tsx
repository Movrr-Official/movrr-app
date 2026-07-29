import { EmptyState } from "@/components/shared/EmptyState";
import { StatsCard } from "@/components/stats/StatsCard";
import { RiderOverview } from "@/components/rider/Overview";
import { AdvertiserCampaignList } from "@/components/advertiser/CampaignList";
import { PartnerOverview } from "@/components/partner/PartnerOverview";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getPartnerDashboard } from "@/services/partner";
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

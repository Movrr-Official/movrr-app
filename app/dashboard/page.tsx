import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { RiderOverview } from "@/components/rider/Overview";
import { AdvertiserCampaignList } from "@/components/advertiser/CampaignList";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { getAdvertiserDashboardData } from "@/services/advertiser";

export default async function DashboardPage() {
  const session = await getCurrentProductSession();

  if (session?.appUser.role === "advertiser") {
    const dashboard = await getAdvertiserDashboardData();
    return (
      <div className="min-h-full px-0">
        <div className="space-y-6 md:space-y-8">
          <PageHeader
            title="Advertiser Overview"
            description="Monitor campaign visibility, rider participation, spend posture, and engagement analytics from the authenticated advertiser product surface."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <StatCard
              title="Active campaigns"
              value={dashboard.analytics.activeCampaigns}
              detail="Campaigns currently delivering in market"
              iconName="megaphone"
            />
            <StatCard
              title="Budget exposure"
              value={formatCurrency(dashboard.analytics.totalBudget)}
              detail="Total configured campaign budget"
              iconName="budget"
            />
            <StatCard
              title="Impressions"
              value={dashboard.analytics.totalImpressions}
              detail="Recorded campaign impression volume"
              iconName="impressions"
            />
            <StatCard
              title="Rider visibility"
              value={dashboard.campaigns.reduce(
                (sum, campaign) => sum + campaign.ridersAssigned,
                0,
              )}
              detail="Participants visible across your campaigns"
              iconName="users"
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
    <div className="min-h-full px-0">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Rider Overview"
          description="Review assigned campaigns, route posture, notifications, and rewards from the web while live execution remains mobile-first in MOVRR Mobile."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <StatCard
            title="Active campaigns"
            value={dashboard.activeCampaigns}
            detail="Campaigns currently assigned to you"
            iconName="megaphone"
          />
          <StatCard
            title="Active routes"
            value={dashboard.activeRoutes}
            detail="Route posture synced from your mobile operational flow"
            iconName="routes"
          />
          <StatCard
            title="Rewards balance"
            value={dashboard.pointsBalance}
            detail="Available points ready for redemption"
            iconName="rewards"
          />
          <StatCard
            title="Last active"
            value={formatRelativeDate(dashboard.lastActive)}
            detail="Derived from your latest authenticated product activity"
            iconName="bell"
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

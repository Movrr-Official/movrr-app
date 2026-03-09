import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { redirect } from "next/navigation";
import { CircleDollarSign, FileText, Trophy, Wallet } from "lucide-react";

export default async function DashboardRewardsPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();

  return (
    <div className="min-h-screen gradient-bg px-4 sm:px-6 py-8 md:py-12 lg:py-16 lg:pt-6">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
        title="Rewards"
        description="Read-only rewards statement for your rider account, including balance, lifetime earnings, and recent adjustments."
        action={{
          label: "Export statement",
          href: "/api/dashboard/rewards/export",
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <StatsCard
          title="Available points"
          value={dashboard.rewardsSummary.availablePoints}
          description="Current balance ready for redemption"
          icon={Wallet}
        />
        <StatsCard
          title="Lifetime earned"
          value={dashboard.rewardsSummary.lifetimePointsEarned}
          description="Total points earned across MOVRR activity"
          icon={Trophy}
        />
        <StatsCard
          title="Awarded"
          value={dashboard.rewardsSummary.awardedPoints}
          description="Points awarded from campaign and route activity"
          icon={CircleDollarSign}
        />
        <StatsCard
          title="Redeemed"
          value={dashboard.rewardsSummary.redeemedPoints}
          description="Points redeemed from the current balance"
          icon={FileText}
        />
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle>Statement breakdown</CardTitle>
          <CardDescription>
            Recent point activity grouped by category. Redemptions and
            adjustments are shown as read-only statement entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Campaign earnings</p>
            <p className="mt-2 text-xl font-semibold">
              +
              {dashboard.rewards
                .filter((item) => item.category === "campaign")
                .reduce((sum, item) => sum + Math.max(item.points, 0), 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Route earnings</p>
            <p className="mt-2 text-xl font-semibold">
              +
              {dashboard.rewards
                .filter((item) => item.category === "route")
                .reduce((sum, item) => sum + Math.max(item.points, 0), 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Adjustments</p>
            <p className="mt-2 text-xl font-semibold">
              {dashboard.rewardsSummary.adjustmentPoints}
            </p>
          </div>
        </CardContent>
      </Card>

      {dashboard.rewards.length ? (
        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Recent statement activity</CardTitle>
            <CardDescription>
              The latest rewards entries synced into your rider web workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{reward.description}</p>
                    <Badge variant="outline" className="capitalize">
                      {reward.category}
                    </Badge>
                    <Badge
                      variant={
                        reward.type === "redeemed"
                          ? "secondary"
                          : reward.type === "adjusted"
                            ? "outline"
                            : "success"
                      }
                      className="capitalize"
                    >
                      {reward.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatRelativeDate(reward.createdAt)}
                  </p>
                </div>
                <p className="text-lg font-semibold">
                  {reward.points > 0 ? "+" : ""}
                  {reward.points}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No rewards activity yet"
          description="Rewards activity will appear here once your rider account starts earning or redeeming points."
          iconName="rewards"
        />
        )}
      </div>
    </div>
  );
}

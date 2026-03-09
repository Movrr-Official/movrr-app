import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { redirect } from "next/navigation";

export default async function DashboardRewardsPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards"
        description="Read-only rewards statement for your rider account, including balance, lifetime earnings, and recent adjustments."
        action={{ label: "Export statement", href: "/api/dashboard/rewards/export" }}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Available points" value={dashboard.rewardsSummary.availablePoints} detail="Current balance ready for redemption" iconName="rewards" />
        <StatCard title="Lifetime earned" value={dashboard.rewardsSummary.lifetimePointsEarned} detail="Total points earned across MOVRR activity" iconName="dashboard" />
        <StatCard title="Awarded" value={dashboard.rewardsSummary.awardedPoints} detail="Points awarded from campaign and route activity" iconName="file" />
        <StatCard title="Redeemed" value={dashboard.rewardsSummary.redeemedPoints} detail="Points redeemed from the current balance" iconName="bell" />
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle>Statement breakdown</CardTitle>
          <CardDescription>Recent point activity grouped by category. Redemptions and adjustments are shown as read-only statement entries.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Campaign earnings</p>
            <p className="mt-2 text-xl font-semibold">+{dashboard.rewards.filter((item) => item.category === "campaign").reduce((sum, item) => sum + Math.max(item.points, 0), 0)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Route earnings</p>
            <p className="mt-2 text-xl font-semibold">+{dashboard.rewards.filter((item) => item.category === "route").reduce((sum, item) => sum + Math.max(item.points, 0), 0)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
            <p className="text-muted-foreground">Adjustments</p>
            <p className="mt-2 text-xl font-semibold">{dashboard.rewardsSummary.adjustmentPoints}</p>
          </div>
        </CardContent>
      </Card>

      {dashboard.rewards.length ? (
        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Recent statement activity</CardTitle>
            <CardDescription>The latest rewards entries synced into your rider web workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.rewards.map((reward) => (
              <div key={reward.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{reward.description}</p>
                    <Badge variant="outline" className="capitalize">{reward.category}</Badge>
                    <Badge variant={reward.type === "redeemed" ? "secondary" : reward.type === "adjusted" ? "outline" : "success"} className="capitalize">
                      {reward.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatRelativeDate(reward.createdAt)}</p>
                </div>
                <p className="text-lg font-semibold">{reward.points > 0 ? "+" : ""}{reward.points}</p>
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
  );
}

import { formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiderDashboard } from "@/schemas";

export function RiderOverview({ data }: { data: RiderDashboard }) {
  const primaryRoute = data.routes[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle>Current rider posture</CardTitle>
          <CardDescription>
            Assignment visibility, compliance freshness, and mobile-synced route status for your rider account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Primary route</p>
              <p className="mt-2 text-xl font-semibold">{primaryRoute?.name ?? "No active route"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{primaryRoute?.city ?? "Awaiting assignment"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Compliance score</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xl font-semibold">{data.currentCompliance}%</p>
                <Badge
                  variant={
                    data.complianceStatus === "healthy"
                      ? "success"
                      : data.complianceStatus === "watch"
                        ? "secondary"
                        : "destructive"
                  }
                  className="capitalize"
                >
                  {data.complianceStatus}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Last mobile sync {formatRelativeDate(data.lastMobileSyncAt)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            Ride execution stays mobile-first in MOVRR Mobile. This workspace stays informational and mirrors your latest assignments, rewards, notifications, and account settings.
          </div>
          <div className="space-y-3">
            {data.campaigns.slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-4"
              >
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.targetZones.length
                      ? campaign.targetZones.join(", ")
                      : "Zones and operational guidance are managed in MOVRR Mobile."}
                  </p>
                </div>
                <Badge
                  variant={campaign.status === "active" ? "success" : "secondary"}
                  className="capitalize"
                >
                  {campaign.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle>Rewards statement</CardTitle>
          <CardDescription>
            Balance, lifetime earnings, and recent reward movement tied to your rider profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Available points</p>
              <p className="mt-2 text-3xl font-semibold">{data.rewardsSummary.availablePoints}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Lifetime earned</p>
              <p className="mt-2 text-3xl font-semibold">{data.rewardsSummary.lifetimePointsEarned}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Awarded</p>
              <p className="mt-2 font-semibold">+{data.rewardsSummary.awardedPoints}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Redeemed</p>
              <p className="mt-2 font-semibold">-{data.rewardsSummary.redeemedPoints}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Adjustments</p>
              <p className="mt-2 font-semibold">{data.rewardsSummary.adjustmentPoints}</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.rewards.slice(0, 4).map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-4"
              >
                <div>
                  <p className="font-medium">{reward.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {reward.category} - {formatRelativeDate(reward.createdAt)}
                  </p>
                </div>
                <span className="font-semibold">
                  {reward.points > 0 ? "+" : ""}
                  {reward.points}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

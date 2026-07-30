import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { hasPartnerCapability } from "@/lib/platform/capabilities";
import { formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { listPartnerRewards } from "@/services/partner";
import { redirect } from "next/navigation";
import { CircleDollarSign, FileText, Trophy, Wallet } from "lucide-react";

async function PartnerRewardsView() {
  const session = await getCurrentProductSession();
  if (!session?.partnerContext) redirect("/unauthorized");

  const canRead = hasPartnerCapability(
    session.partnerContext.capabilities,
    "rewards.catalog.read",
  );
  const canManage = hasPartnerCapability(
    session.partnerContext.capabilities,
    "rewards.manage",
  );

  if (!canRead) {
    return (
      <div className="page-canvas">
        <EmptyState
          title="Rewards catalog unavailable"
          description="Your membership role cannot read partner-scoped rewards."
          iconName="rewards"
        />
      </div>
    );
  }

  let rewards: Awaited<ReturnType<typeof listPartnerRewards>> = [];
  let listError: string | null = null;
  try {
    rewards = await listPartnerRewards();
  } catch (error) {
    listError =
      error instanceof Error ? error.message : "Failed to load rewards";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Rewards"
            description={
              canManage
                ? "Partner-scoped reward catalog from Platform. Manage items when rewards.manage is granted."
                : "Read-only partner-scoped reward catalog from Platform."
            }
          />
          {canManage ? (
            <Button asChild size="sm">
              <Link href="/dashboard/rewards/create">Add catalog item</Link>
            </Button>
          ) : null}
        </div>
        {listError ? (
          <p className="text-sm text-destructive">{listError}</p>
        ) : null}
        {rewards.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Partner catalog</CardTitle>
              <CardDescription>
                GET /api/v1/partners/rewards — presentation only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {reward.name ?? reward.id}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {reward.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {reward.fulfilmentType ? (
                      <Badge variant="outline">{reward.fulfilmentType}</Badge>
                    ) : null}
                    {reward.status ? (
                      <Badge variant="secondary" className="capitalize">
                        {reward.status}
                      </Badge>
                    ) : null}
                    {typeof reward.pointsCost === "number" ? (
                      <Badge>{reward.pointsCost} pts</Badge>
                    ) : null}
                    {canManage ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/rewards/${reward.id}/edit`}>
                          Manage
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No partner rewards yet"
            description="Partner-scoped catalog items will appear here once Platform returns them."
            iconName="rewards"
          />
        )}
      </div>
    </div>
  );
}

export default async function DashboardRewardsPage() {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");

  if (session.appUser.role === "partner") {
    return <PartnerRewardsView />;
  }

  if (session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Rewards"
          description="Read-only rewards statement for your rider account, including balance, lifetime earnings, and recent adjustments."
          action={{
            label: "Rewards shop",
            href: "/dashboard/rewards/shop",
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

        <Card className="border-border">
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
          <Card className="border-border">
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
                    {reward.type === "redeemed"
                      ? "-"
                      : reward.points > 0
                        ? "+"
                        : ""}
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

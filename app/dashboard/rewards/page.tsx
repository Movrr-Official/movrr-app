import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";
import Link from "next/link";
import { RewardFinancialSummary } from "@/components/rider/RewardFinancialSummary";
import { listRedemptions } from "@/lib/platform/riderPlatform";
import { EarnedAchievements } from "@/components/rider/EarnedAchievements";
import { StatusToast } from "@/components/form/StatusToast";
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
import { getRiderRewardsData } from "@/services/rider";
import { listPartnerRewards } from "@/services/partner";
import { redirect } from "next/navigation";
import { CircleDollarSign, FileText, Trophy, Wallet } from "lucide-react";

async function PartnerRewardsView() {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
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
          title={t("Rewards catalog unavailable")}
          description={t("Your membership role cannot read partner-scoped rewards.")}
          iconName="rewards"
        />
      </div>
    );
  }

  let rewards: Awaited<ReturnType<typeof listPartnerRewards>> = [];
  let listError: string | null = null;
  try {
    rewards = await listPartnerRewards();
  } catch {
    listError =
      "Rewards are temporarily unavailable. Please try again.";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title={t("Rewards")}
            description={
              canManage
                ? t("Manage the rewards offered by your organisation.")
                : t("Rewards offered by your organisation.")
            }
          />
          {canManage ? (
            <Button asChild size="sm">
              <Link href="/dashboard/rewards/create">{t("Add catalog item")}</Link>
            </Button>
          ) : null}
        </div>
        {listError ? (
          <p className="text-sm text-destructive">{listError ? t(listError) : null}</p>
        ) : null}
        {rewards.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>{t("Partner catalog")}</CardTitle>
              <CardDescription>{t("Your rewards and their availability.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {reward.name ?? t("Reward")}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">

                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {reward.fulfilmentType ? (
                      <Badge variant="outline">{partnerLabel(reward.fulfilmentType, locale)}</Badge>
                    ) : null}
                    {reward.status ? (
                      <Badge variant="secondary" className="capitalize">
                        {t(reward.status)}
                      </Badge>
                    ) : null}
                    {typeof reward.pointsCost === "number" ? (
                      <Badge>{reward.pointsCost}{t("pts")}</Badge>
                    ) : null}
                    {canManage ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/rewards/${reward.id}/edit`}>{t("Manage")}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title={t("No partner rewards yet")}
            description={t("Rewards will appear here after you create your first reward.")}
            iconName="rewards"
          />
        )}
      </div>
    </div>
  );
}

export default async function DashboardRewardsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");

  if (session.appUser.role === "partner") {
    return <PartnerRewardsView />;
  }

  if (session.appUser.role !== "rider") redirect("/dashboard");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const [dashboard, orders] = await Promise.all([getRiderRewardsData(), listRedemptions()]);

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error} />
        <PageHeader
          title="Rewards"
          description="Read-only rewards statement for your rider account, including balance, lifetime earnings, and recent adjustments."
          action={{ label: "Download statement", href: "/api/dashboard/rewards/export", method: "post" }}
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
        <Card>
          <CardHeader><CardTitle>Redemption history</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {orders.length ? orders.map(order => (
              <Link className="block rounded-xl border border-border/60 p-4 hover:text-primary" key={order.id} href={`/dashboard/rewards/orders/${order.id}`}>
                <span className="font-medium">{order.rewardTitle || "Reward"}</span>
                <span className="ml-3 text-sm">{order.redemptionStatus} / {order.isFree ? "Free" : `${order.pointsSpent} pts originally requested`}</span>
                <RewardFinancialSummary financial={order.financial} locale={session.appUser.languagePreference==="nl-NL"?"nl":"en"}/>
              </Link>
            )) : <p>No rewards claimed yet.</p>}
          </CardContent>
        </Card>
        <EarnedAchievements />

      </div>
    </div>
  );
}

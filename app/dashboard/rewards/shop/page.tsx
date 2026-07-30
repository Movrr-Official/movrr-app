import Link from "next/link";
import { redeemRewardAction } from "@/app/actions/rider";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWalletBalance, listRewardsCatalog } from "@/lib/platform/riderPlatform";
import { redirect } from "next/navigation";
import { getCurrentProductSession } from "@/lib/appUser";
import { ShoppingBag, Wallet } from "lucide-react";

export default async function RewardsShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  let balance = { pointsBalance: 0, lifetimePointsEarned: 0 };
  let catalog: Awaited<ReturnType<typeof listRewardsCatalog>> = [];
  let loadError: string | null = null;

  try {
    [balance, catalog] = await Promise.all([
      getWalletBalance(),
      listRewardsCatalog(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load rewards shop";
  }

  const activeItems = catalog.filter(
    (item) => !item.status || item.status === "active",
  );

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Rewards Shop"
          description="Browse partner catalog items and redeem points via Platform POST /rewards/redeem."
          action={{ label: "View statement", href: "/dashboard/rewards" }}
        />
        <StatusToast success={success} error={error ?? loadError} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatsCard
            title="Available points"
            value={balance.pointsBalance}
            description="Current wallet balance from Platform"
            icon={Wallet}
          />
          <StatsCard
            title="Catalog items"
            value={activeItems.length}
            description="Active rewards available for redemption"
            icon={ShoppingBag}
          />
        </div>

        {activeItems.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Available rewards</CardTitle>
              <CardDescription>
                Redeem points for partner fulfilment items.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/70 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {item.title ?? item.name ?? item.id}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {typeof item.pointsCost === "number" ? (
                        <Badge>{item.pointsCost} pts</Badge>
                      ) : null}
                      {item.fulfilmentType ? (
                        <Badge variant="outline">{item.fulfilmentType}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <form action={redeemRewardAction}>
                    <input type="hidden" name="catalogItemId" value={item.id} />
                    <SubmitButton
                      type="submit"
                      disabled={
                        typeof item.pointsCost === "number" &&
                        balance.pointsBalance < item.pointsCost
                      }
                      pendingLabel="Redeeming"
                    >
                      Redeem
                    </SubmitButton>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No rewards available"
            description="Active catalog items will appear here once Platform returns them."
            iconName="rewards"
          />
        )}

        <Link
          href="/dashboard/rewards"
          className="text-sm text-primary hover:underline"
        >
          Back to rewards statement
        </Link>
      </div>
    </div>
  );
}

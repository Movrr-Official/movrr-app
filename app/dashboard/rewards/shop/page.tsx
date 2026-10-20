import Link from "next/link";
import { requireProductSession } from "@/lib/appUser";
import { listRewardsCatalog, listRedemptions } from "@/lib/platform/riderPlatform";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export default async function RewardsShopPage() {
  await requireProductSession(["rider"]);
  const [catalog, orders] = await Promise.all([listRewardsCatalog(), listRedemptions()]);
  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Rewards Shop"
          description="Web purchasing is unavailable. Existing rewards and delivery remain accessible."
          action={{ label: "View statement", href: "/dashboard/rewards" }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Rewards catalog</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {catalog.length ? (
              catalog.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-border/60 p-4"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <Badge>
                    {item.points_price === 0 ? "Free" : `${item.points_price} pts`}
                  </Badge>
                  <p className="text-sm">
                    {item.available ? "Catalog item" : "Currently unavailable"}
                  </p>
                </div>
              ))
            ) : (
              <p>No rewards available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length ? (
              orders.map((order) => (
                <Link
                  className="block rounded-xl border border-border/60 p-4 hover:text-primary"
                  key={order.id}
                  href={`/dashboard/rewards/orders/${order.id}`}
                >
                  <span className="font-medium">{order.rewardTitle || "Reward"}</span>
                  <span className="ml-3 text-sm">
                    {order.redemptionStatus} /{" "}
                    {order.isFree ? "Free" : `${order.pointsSpent} pts`}
                  </span>
                </Link>
              ))
            ) : (
              <p>No rewards claimed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { getRedemption } from "@/lib/platform/riderPlatform";
import { formatRelativeDate } from "@/lib/format";
import { notFound, redirect } from "next/navigation";

export default async function RewardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const { id } = await params;
  const order = await getRedemption(id);
  if (!order) notFound();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Order detail"
          description="Fulfilment status for your redeemed reward."
        />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Redemption {order.id}</CardTitle>
            <CardDescription>
              GET /api/v1/rewards/redemptions/:id — presentation only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {order.state ? (
                <Badge variant="secondary" className="capitalize">
                  {order.state.replace(/_/g, " ")}
                </Badge>
              ) : null}
              {order.progress ? (
                <Badge variant="outline" className="capitalize">
                  {order.progress.replace(/_/g, " ")}
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-muted-foreground">Catalog item</p>
                <p className="mt-1 font-medium break-all">
                  {order.catalogItemId ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-muted-foreground">Points cost</p>
                <p className="mt-1 font-medium">
                  {typeof order.pointsCost === "number"
                    ? `${order.pointsCost} pts`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-muted-foreground">Created</p>
                <p className="mt-1 font-medium">
                  {formatRelativeDate(order.createdAt ?? null)}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-muted-foreground">Last updated</p>
                <p className="mt-1 font-medium">
                  {formatRelativeDate(order.updatedAt ?? null)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!order.state || order.state === "pending" ? (
          <EmptyState
            title="Fulfilment in progress"
            description="Partner fulfilment will update this order as it progresses through the Platform."
            iconName="rewards"
          />
        ) : null}

        <Link
          href="/dashboard/rewards/shop"
          className="text-sm text-primary hover:underline"
        >
          Back to rewards shop
        </Link>
      </div>
    </div>
  );
}

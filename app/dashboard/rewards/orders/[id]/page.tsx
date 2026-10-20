import Link from "next/link";
import { requireProductSession } from "@/lib/appUser";
import { getRedemption, getFulfilment } from "@/lib/platform/riderPlatform";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RewardCredential } from "@/components/rider/RewardCredential";
import { notFound } from "next/navigation";
export default async function RewardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireProductSession(["rider"]);
  const order = await getRedemption((await params).id);
  if (!order) notFound();
  const fulfilment = order.fulfilmentId ? await getFulfilment(order.fulfilmentId) : null;
  return (
    <div className="page-canvas">
      <div className="space-y-6">
        <PageHeader
          title={order.rewardTitle || "Reward detail"}
          description="Your reward and delivery status."
        />
        <Card>
          <CardHeader>
            <CardTitle>{order.isFree ? "Free" : `${order.pointsSpent} pts`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge>{fulfilment?.state ?? order.redemptionStatus}</Badge>
            <p>{fulfilment?.progress}</p>
            <p className="text-sm">
              Claimed{" "}
              {new Date(order.createdAt).toLocaleString("en-GB", {
                timeZone: "Europe/Amsterdam",
              })}
            </p>
            {fulfilment &&
              ["instant_digital", "qr_barcode"].includes(fulfilment.fulfilmentType) &&
              ["ready", "awaiting_collection", "completed"].includes(fulfilment.progress) &&
              (!fulfilment.outcome || fulfilment.outcome === "success") &&
              !(fulfilment.fulfilmentType === "qr_barcode" && ["validated", "collected", "completed"].includes(fulfilment.state)) && (
                <RewardCredential
                  key={`${session.appUser.id}:${fulfilment.id}`}
                  accountId={session.appUser.id}
                  fulfilmentId={fulfilment.id}
                />
              )}
            {!fulfilment && (
              <p>Historical reward. Contact support for delivery assistance.</p>
            )}
          </CardContent>
        </Card>
        <Link href="/dashboard/rewards" className="text-primary">
          My Rewards
        </Link>
      </div>
    </div>
  );
}

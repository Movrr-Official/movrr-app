import Link from "next/link";
import { ClipboardList, QrCode, Shield } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatsCard } from "@/components/stats/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PartnerDashboard } from "@/schemas";

export function PartnerOverview({
  dashboard,
}: {
  dashboard: PartnerDashboard;
}) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <StatsCard
          title="Pending collections"
          value={dashboard.pendingCount}
          description="Fulfilments awaiting partner collection confirmation"
          icon={ClipboardList}
        />
        <StatsCard
          title="Failure rate"
          value={dashboard.failureRateLabel}
          description="Presentation field from Platform analytics (when available)"
          icon={Shield}
        />
        <StatsCard
          title="Analytics series"
          value={dashboard.analyticsSeriesCount}
          description="Read-model series points from partner analytics"
          icon={QrCode}
        />
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Reward Partner workspace</CardTitle>
              <CardDescription>
                Organisation-scoped operations via Platform API. This is not a
                rider marketplace.
              </CardDescription>
            </div>
            {dashboard.membershipRole ? (
              <Badge variant="outline" className="capitalize">
                {dashboard.membershipRole}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/collections">Pending collections</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/validate">Validate token</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/analytics">Analytics</Link>
          </Button>
        </CardContent>
      </Card>

      {dashboard.pendingCount === 0 ? (
        <EmptyState
          title="No pending collections"
          description="When riders redeem QR/collection rewards, pending fulfilments from Platform will appear here."
          iconName="dashboard"
        />
      ) : null}
    </div>
  );
}

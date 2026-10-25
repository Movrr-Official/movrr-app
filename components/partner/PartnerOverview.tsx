import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";
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

export async function PartnerOverview({
  dashboard,
}: {
  dashboard: PartnerDashboard;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <StatsCard
          title={t("Pending collections")}
          value={dashboard.pendingCount}
          description={t("Rewards waiting for collection")}
          icon={ClipboardList}
        />
        <StatsCard
          title={t("Ready for handover")}
          value={dashboard.validatedCount}
          description={t("Scanned rewards awaiting handover")}
          icon={Shield}
        />
        <StatsCard
          title={t("Collections completed")}
          value={dashboard.completedCount}
          description={t("Confirmed reward collections")}
          icon={QrCode}
        />
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("Reward Partner workspace")}</CardTitle>
              <CardDescription>{t("Manage your team, rewards and customer collections.")}</CardDescription>
            </div>
            {dashboard.membershipRole ? (
              <Badge variant="outline" className="capitalize">
                {partnerLabel(dashboard.membershipRole, locale)}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/collections">{t("Pending collections")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/validate">{t("Scan a reward")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/analytics">{t("Analytics")}</Link>
          </Button>
        </CardContent>
      </Card>

      {dashboard.pendingCount === 0 ? (
        <EmptyState
          title={t("No pending collections")}
          description={t("Rewards ready for customer collection will appear here.")}
          iconName="dashboard"
        />
      ) : null}
    </div>
  );
}

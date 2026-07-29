import { AdvertiserPerformanceChart } from "@/components/advertiser/PerformanceChart";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/stats/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import {
  formatCompactNumber,
  formatCurrency,
  formatRelativeDate,
} from "@/lib/format";
import type { AdvertiserAnalyticsRange } from "@/schemas";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getPartnerAnalytics } from "@/services/partner";
import { redirect } from "next/navigation";
import { CircleDollarSign, LineChart, ScanLine } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
] as const;

async function PartnerAnalyticsView() {
  let analytics: Awaited<ReturnType<typeof getPartnerAnalytics>> = {
    series: [],
  };
  let loadError: string | null = null;
  try {
    analytics = await getPartnerAnalytics();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load analytics";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Analytics"
          description="Partner analytics read models from Platform GET /api/v1/partners/analytics."
        />
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <StatsCard
            title="Series points"
            value={analytics.series.length}
            description="Count of sink series entries returned by Platform"
            icon={LineChart}
          />
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Analytics series</CardTitle>
            <CardDescription>
              Presentation of Platform sink read models only — no local
              aggregation rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.series.length ? (
              analytics.series.map((point, index) => (
                <div
                  key={String(point.key ?? point.label ?? index)}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-4"
                >
                  <p className="font-medium">
                    {String(point.label ?? point.key ?? `Series ${index + 1}`)}
                  </p>
                  <Badge variant="outline">
                    {typeof point.value === "number"
                      ? point.value.toLocaleString()
                      : "—"}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyState
                title="No partner analytics yet"
                description="Series will appear here when Platform returns analytics sink data for your organisation."
                iconName="dashboard"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");

  if (session.appUser.role === "partner") {
    return <PartnerAnalyticsView />;
  }

  if (session.appUser.role !== "advertiser") redirect("/dashboard");

  const params = await searchParams;
  const range = (
    typeof params.range === "string" ? params.range : "90d"
  ) as AdvertiserAnalyticsRange;
  const dashboard = await getAdvertiserDashboardData(range);

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Analytics"
          description="Advertiser campaign performance, zone concentration, and engagement trends scoped to the authenticated advertiser workspace."
          action={{
            label: "Export summary",
            href: "/api/dashboard/analytics/export",
            method: "post",
            fields: { range: dashboard.analytics.range },
          }}
        />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Analytics range</CardTitle>
            <CardDescription>
              Filter the reporting window for campaign performance and trend
              series.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              method="get"
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Select
                name="range"
                defaultValue={dashboard.analytics.range}
                options={RANGE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                className="sm:max-w-xs"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Apply range
              </button>
              <p className="text-sm text-muted-foreground">
                Last updated{" "}
                {formatRelativeDate(dashboard.analytics.lastUpdatedAt)}
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <StatsCard
            title="Budget exposure"
            value={formatCurrency(dashboard.analytics.totalBudget)}
            description="Campaign budgets included in the selected range"
            icon={CircleDollarSign}
          />
          <StatsCard
            title="Impressions"
            value={formatCompactNumber(dashboard.analytics.totalImpressions)}
            description="Attributed campaign impression volume"
            icon={LineChart}
          />
          <StatsCard
            title="QR scans"
            value={formatCompactNumber(dashboard.analytics.totalQrScans)}
            description="Attributed QR scan volume"
            icon={ScanLine}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Campaign performance</CardTitle>
              <CardDescription>
                Trend series for impressions and QR scans in the selected
                reporting window.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.analytics.campaignPerformance.length ? (
                <AdvertiserPerformanceChart
                  data={dashboard.analytics.campaignPerformance}
                />
              ) : (
                <EmptyState
                  title="No analytics data in this range"
                  description="Adjust the reporting range or wait for published campaign delivery to accumulate more attributable activity."
                  iconName="dashboard"
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Zone concentration</CardTitle>
              <CardDescription>
                Campaign distribution across configured zones and hot-zone
                groupings where current data exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.analytics.zonePerformance.length ? (
                dashboard.analytics.zonePerformance.map((zone) => (
                  <div
                    key={zone.label}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-4"
                  >
                    <div>
                      <p className="font-medium">{zone.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Campaigns visible in this geography bucket
                      </p>
                    </div>
                    <Badge variant="outline">{zone.campaignCount}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Zone-level performance data is not available yet for the
                  selected reporting range.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Trend summary</CardTitle>
            <CardDescription>
              Reporting cadence across the selected time window.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {dashboard.analytics.trendSeries.length ? (
              dashboard.analytics.trendSeries.slice(-6).map((point) => (
                <div
                  key={point.label}
                  className="rounded-xl border border-border/60 bg-background/70 p-4"
                >
                  <p className="font-medium">{point.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Impressions {formatCompactNumber(point.impressions)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    QR scans {formatCompactNumber(point.qrScans)}
                  </p>
                </div>
              ))
            ) : (
              <div className="md:col-span-3">
                <EmptyState
                  title="No trend series available"
                  description="Trend reporting will appear here when campaign delivery produces attributable activity in the selected range."
                  iconName="dashboard"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




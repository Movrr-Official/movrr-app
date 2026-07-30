import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGovernmentProgrammes } from "@/lib/platform/governmentPlatform";
import { getCurrentProductSession } from "@/lib/appUser";
import { redirect } from "next/navigation";
import { ClipboardList, LineChart, Megaphone, ShieldCheck } from "lucide-react";

export default async function GovernmentReportsPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "government") redirect("/dashboard");

  let data: Awaited<ReturnType<typeof getGovernmentProgrammes>> | null = null;
  let error: string | null = null;

  try {
    data = await getGovernmentProgrammes();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load reports";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Reports"
          description="Programme reporting summaries derived from Platform analytics hooks."
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
              <StatsCard
                title="Campaigns tracked"
                value={data.campaigns.length}
                description="Programme-linked campaign records"
                icon={Megaphone}
              />
              <StatsCard
                title="Impressions"
                value={data.kpis.totalImpressions}
                description="Aggregate impression reporting"
                icon={LineChart}
              />
              <StatsCard
                title="Verified rides"
                value={data.complianceSummary.verifiedRides}
                description="Compliance-verified sessions"
                icon={ShieldCheck}
              />
              <StatsCard
                title="Pending review"
                value={data.complianceSummary.pendingReview}
                description="Sessions awaiting review"
                icon={ClipboardList}
              />
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Programme report</CardTitle>
                <CardDescription>
                  Consolidated KPI snapshot for government reporting cycles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between rounded-xl border border-border/60 p-4">
                  <span>Active campaigns</span>
                  <span className="font-medium">{data.kpis.activeCampaigns}</span>
                </div>
                <div className="flex justify-between rounded-xl border border-border/60 p-4">
                  <span>Total impressions</span>
                  <span className="font-medium">{data.kpis.totalImpressions}</span>
                </div>
                <div className="flex justify-between rounded-xl border border-border/60 p-4">
                  <span>Rejected rides</span>
                  <span className="font-medium">
                    {data.complianceSummary.rejectedRides}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            title="Reports unavailable"
            description="Programme reports will appear when Platform returns analytics data."
            iconName="file"
          />
        )}
      </div>
    </div>
  );
}
